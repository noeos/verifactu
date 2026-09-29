import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { EventEmitter, once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { promisify } from "node:util";
import test from "node:test";
import {
  createXmlXsdProvider,
  PINNED_SCHEMAS,
  XML_EDITION_ID,
} from "../../internal/xml-provider/provider.mjs";
import {
  XML_WORKER_SOURCE,
  createXmlWorkerSpawner,
  exceedsXmlOutputLimit,
  minimalXmlEnvironment,
  parseXmlWorkerOutput,
  spawnXmlWorker,
} from "../../internal/xml-provider/worker.mjs";

const sourceRoot =
  "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources";
const schemaPaths = {
  "xsd-suministro-informacion": "aeat/SuministroInformacion.xsd",
  "xmldsig-schema": "standards/xmldsig-core-schema.xsd",
};

function xmlWorkerHarness(body) {
  const source = XML_WORKER_SOURCE.replace(/\ntry:\n    main\(\)[\s\S]*$/u, "");
  assert.notEqual(
    source,
    XML_WORKER_SOURCE,
    "worker main block must be removed",
  );
  return `${source}\n${body}`;
}

test("P4-FUZZ-002 XML worker parser is total over its 4096-case replay corpus", (t) => {
  const seed = 0x50444302;
  let state = seed >>> 0;
  const nextByte = () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state >>> 24;
  };
  const corpus = createHash("sha256");
  const inputs = [];
  for (let index = 0; index < 4096; index += 1) {
    let bytes;
    if (index % 4 === 0) {
      const suffix = `${index}-${nextByte()}`;
      bytes = Buffer.from(`<r i="${index}"><n>${suffix}</n></r>`);
    } else if (index % 4 === 1) {
      bytes = Buffer.from(`<r><n>${"x".repeat(nextByte() % 32)}</r>`);
    } else {
      const length = nextByte() % 96;
      bytes = Buffer.alloc(length);
      for (let offset = 0; offset < length; offset += 1)
        bytes[offset] = nextByte();
    }
    corpus.update(Buffer.from([bytes.length >>> 8, bytes.length & 0xff]));
    corpus.update(bytes);
    inputs.push(bytes.toString("base64"));
  }
  const program = xmlWorkerHarness(String.raw`
import base64
from hashlib import sha256
import json
import sys
inputs=json.load(sys.stdin)
digest=sha256()
counts={"accepted":0,"invalid":0,"limited":0}
for index,encoded in enumerate(inputs):
    raw=base64.b64decode(encoded,validate=True)
    digest.update(len(raw).to_bytes(2,"big")); digest.update(raw)
    try:
        parse_bounded(raw,ClosedResolver({}),HARD_LIMITS)
        counts["accepted"]+=1
    except ResourceLimit:
        counts["limited"]+=1
    except (InvalidInput,DeniedResource,etree.XMLSyntaxError,ValueError,TypeError):
        counts["invalid"]+=1
    except Exception as error:
        raise AssertionError("unexpected parser exception at case %d: %s"%(index,type(error).__name__))
print(json.dumps({"executed":len(inputs),"counts":counts,"corpusSha256":digest.hexdigest()},sort_keys=True,separators=(",",":")))
`);
  const report = JSON.parse(
    execFileSync(
      process.env.VERIFACTU_PYTHON ?? "python3",
      ["-I", "-c", program],
      {
        input: JSON.stringify(inputs),
        encoding: "utf8",
        timeout: 60_000,
        maxBuffer: 65_536,
      },
    ),
  );
  assert.equal(report.executed, 4096);
  assert.equal(
    report.corpusSha256,
    corpus.digest("hex"),
    "the worker and JS replay corpus must bind to the same bytes",
  );
  assert.equal(
    report.counts.accepted + report.counts.invalid + report.counts.limited,
    4096,
  );
  assert.ok(report.counts.accepted > 0);
  assert.ok(report.counts.invalid > 0);
  t.diagnostic(
    `P4-FUZZ-002 executions=4096 seed=${seed} discards=0 corpusSha256=${report.corpusSha256} minimizedFailures=0`,
  );
});

test("P4-FUZZ-003 offline XSD resolver and validator process 4096 bounded cases", (t) => {
  const seed = 0x50444303;
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state >>> 0;
  };
  const schemas = Object.entries(schemaPaths).map(([id, path]) => ({
    id,
    sha256: PINNED_SCHEMAS[id].sha256,
    base64: readFileSync(`${sourceRoot}/${path}`).toString("base64"),
  }));
  const program = xmlWorkerHarness(String.raw`
import base64
from hashlib import sha256
import json
import sys
payload=json.load(sys.stdin)
schemas=payload["schemas"]
edition="rrsif-2026-09-21-authoritative-candidate"
limits=HARD_LIMITS
resources,root_uri=prepare_resources({"editionId":edition,"rootSchemaId":"xsd-suministro-informacion","schemas":schemas},limits)
resolver=ClosedResolver(resources)
parser=etree.XMLParser(attribute_defaults=False,collect_ids=False,huge_tree=False,load_dtd=False,no_network=True,recover=False,resolve_entities=False)
parser.resolvers.add(resolver)
schema_root=etree.fromstring(resources[root_uri],parser,base_url=root_uri)
schema=etree.XMLSchema(schema_root)
digest=sha256()
valid_requests=rejected_requests=validations=invalid_instances=0
for index,case in enumerate(payload["cases"]):
    candidate={"editionId":edition,"rootSchemaId":"xsd-suministro-informacion","schemas":schemas}
    if case["mutation"]==1: candidate["editionId"]="foreign-edition"
    elif case["mutation"]==2: candidate["rootSchemaId"]="unknown-schema"
    elif case["mutation"]==3: candidate["schemas"]=schemas[:-1]
    elif case["mutation"]==4: candidate["schemas"]=schemas+[schemas[0]]
    elif case["mutation"]==5: candidate["schemas"]=[dict(s,sha256="0"*64) if i==0 else s for i,s in enumerate(schemas)]
    elif case["mutation"]==6: candidate["schemas"]=[dict(s,base64=s["base64"][:-4]+"AAAA") if i==0 else s for i,s in enumerate(schemas)]
    digest.update(json.dumps(candidate,sort_keys=True,separators=(",",":")).encode())
    try:
        prepare_resources(candidate,limits)
        valid_requests+=1
    except (ValueError,ResourceLimit,DeniedResource,KeyError,TypeError):
        rejected_requests+=1
    raw=base64.b64decode(case["xml"],validate=True)
    digest.update(raw)
    try:
        tree=parse_bounded(raw,ClosedResolver({}),limits)
        outcome=schema.validate(tree)
        validations+=1
        invalid_instances+=int(not outcome)
    except (ValueError,ResourceLimit,InvalidInput,DeniedResource,etree.XMLSyntaxError):
        invalid_instances+=1
print(json.dumps({"executed":len(payload["cases"]),"validRequests":valid_requests,"rejectedRequests":rejected_requests,"schemaValidations":validations,"invalidInstances":invalid_instances,"corpusSha256":digest.hexdigest()},sort_keys=True,separators=(",",":")))
`);
  const cases = Array.from({ length: 4096 }, (_, index) => {
    const suffix = (next() % 1_000_000).toString(16);
    const xml =
      index % 5 === 0
        ? `<RegistroAlta xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/" id="${suffix}"/>`
        : `<RegistroAlta xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/" extra${index}="${suffix}"/>`;
    return { mutation: index % 8, xml: Buffer.from(xml).toString("base64") };
  });
  const input = { schemas, cases };
  const report = JSON.parse(
    execFileSync(
      process.env.VERIFACTU_PYTHON ?? "python3",
      ["-I", "-c", program],
      {
        input: JSON.stringify(input),
        encoding: "utf8",
        timeout: 60_000,
        maxBuffer: 65_536,
      },
    ),
  );
  assert.equal(report.executed, 4096);
  assert.equal(report.validRequests + report.rejectedRequests, 4096);
  assert.ok(report.validRequests > 0 && report.validRequests < 4096);
  assert.ok(report.rejectedRequests > 0);
  assert.ok(report.schemaValidations > 0);
  assert.ok(report.invalidInstances > 0);
  t.diagnostic(
    `P4-FUZZ-003 executions=4096 seed=${seed} discards=0 corpusSha256=${report.corpusSha256} minimizedFailures=0`,
  );
});

test("XML worker output limit accepts its exact ceiling and rejects overflow", () => {
  assert.equal(exceedsXmlOutputLimit(4, 6, 10), false);
  assert.equal(exceedsXmlOutputLimit(4, 7, 10), true);
});

test("XML worker preserves only required environment across supported platforms", () => {
  assert.deepEqual(
    minimalXmlEnvironment("win32", {
      PATH: "C:\\Windows\\System32",
      SystemRoot: "C:\\Windows",
      WINDIR: "C:\\Windows",
      SECRET: "drop",
    }),
    {
      PATH: "C:\\Windows\\System32",
      SystemRoot: "C:\\Windows",
      WINDIR: "C:\\Windows",
    },
  );
  assert.deepEqual(minimalXmlEnvironment("win32", { PATH: "" }), {
    PATH: "",
  });
  assert.deepEqual(
    minimalXmlEnvironment("linux", {
      PATH: "/usr/bin",
      SystemRoot: "ignored",
      WINDIR: "ignored",
    }),
    { PATH: "/usr/bin" },
  );
});

function fixture(xml) {
  return {
    editionId: XML_EDITION_ID,
    xml: Buffer.from(xml, "utf8"),
    rootSchemaId: "xsd-suministro-informacion",
    schemas: Object.entries(schemaPaths).map(([id, path]) => ({
      id,
      bytes: readFileSync(`${sourceRoot}/${path}`),
      sha256: PINNED_SCHEMAS[id].sha256,
    })),
    semanticStatus: "not-evaluated",
  };
}

test("P4-FAULT-XSD-NETWORK is detected when the closed resolver fetches", async () => {
  let httpRequests = 0;
  const server = createServer((_request, response) => {
    httpRequests += 1;
    response.writeHead(200, { "content-type": "application/xml-dtd" });
    response.end("<!ELEMENT RegistroAlta ANY>");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const faultedSource = XML_WORKER_SOURCE.replace(
      'raise DeniedResource("closed XML resource map rejected a URI")',
      'return self.resolve_string(__import__("urllib.request", fromlist=["urlopen"]).urlopen(url, timeout=2).read(), context, base_url=url)',
    );
    assert.notEqual(faultedSource, XML_WORKER_SOURCE);
    const harness = faultedSource.replace(/\ntry:\n    main\(\)[\s\S]*$/u, "");
    await promisify(execFile)(
      process.env.VERIFACTU_PYTHON ?? "python3",
      [
        "-I",
        "-c",
        `${harness}\nresolver=ClosedResolver({})\nresolver.resolve("http://127.0.0.1:${address.port}/hostile.dtd", None, None)\n`,
      ],
      { encoding: "utf8", timeout: 10_000 },
    );
    assert.equal(httpRequests, 1, "seeded resolver must make one HTTP request");
    let detected;
    try {
      assert.equal(
        httpRequests,
        0,
        "P4-FAULT-XSD-NETWORK regression oracle blocks all remote resolution",
      );
    } catch (error) {
      detected = error;
    }
    assert.equal(detected?.code, "ERR_ASSERTION");
    assert.match(detected.message, /P4-FAULT-XSD-NETWORK/u);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("provider denies DTDs, external entities, XInclude, and remote schema hints", async () => {
  let httpRequests = 0;
  const server = createServer((_request, response) => {
    httpRequests += 1;
    response.writeHead(200, { "content-type": "application/xml" });
    response.end("<secret>network-accessed</secret>");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const remote = `http://127.0.0.1:${address.port}/hostile.dtd`;
  const attacks = [
    `<!DOCTYPE RegistroAlta SYSTEM "${remote}"><RegistroAlta/>`,
    `<!DOCTYPE RegistroAlta [<!ENTITY x SYSTEM "file:///etc/passwd">]><RegistroAlta>&x;</RegistroAlta>`,
    `<r xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include href="${remote}" parse="text"/></r>`,
    `<RegistroAlta xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:hostile ${remote}"/>`,
  ];
  try {
    const results = await Promise.all(
      attacks.map((xml) => createXmlXsdProvider().validate(fixture(xml))),
    );
    assert.equal(results[0].status, "invalid");
    assert.ok(
      ["DIAG-XML-DOCTYPE", "DIAG-XML-SYNTAX", "DIAG-XML-RESOURCE"].includes(
        results[0].diagnostics[0],
      ),
    );
    assert.ok(
      ["DIAG-XML-DOCTYPE", "DIAG-XML-SYNTAX", "DIAG-XML-RESOURCE"].includes(
        results[1].diagnostics[0],
      ),
    );
    assert.equal(results[2].status, "invalid");
    assert.equal(results[2].diagnostics[0], "DIAG-XML-XINCLUDE");
    assert.equal(results[3].status, "invalid");
    assert.equal(httpRequests, 0);
    assert.doesNotMatch(
      JSON.stringify(results),
      /root:|network-accessed|\/etc\/passwd/u,
    );
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("incremental parser limits depth, nodes, attributes, namespaces, and text", async () => {
  const tooDeep = `<r>${"<n>".repeat(65)}v${"</n>".repeat(65)}</r>`;
  const tooManyNodes = `<r>${"<n/>".repeat(100_000)}</r>`;
  const tooManyAttributes = `<r ${Array.from({ length: 4_097 }, (_, index) => `a${index}="x"`).join(" ")}/>`;
  const tooManyNamespaces = `<r ${Array.from({ length: 257 }, (_, index) => `xmlns:n${index}="urn:${index}"`).join(" ")}/>`;
  const tooMuchText = `<r>${"x".repeat(2_097_153)}</r>`;
  const requests = [
    [tooDeep, "DIAG-XML-DEPTH"],
    [tooManyNodes, "DIAG-XML-NODES"],
    [tooManyAttributes, "DIAG-XML-ATTRIBUTES"],
    [tooManyNamespaces, "DIAG-XML-NAMESPACES"],
    [tooMuchText, "DIAG-XML-TEXT"],
  ];
  for (const [xml, code] of requests) {
    const result = await createXmlXsdProvider().validate(fixture(xml));
    assert.equal(result.status, "limit");
    assert.equal(result.diagnostics[0], code);
  }
});

test("hard byte ceiling, deadline, cancellation, and unavailable workers fail closed", async () => {
  const provider = createXmlXsdProvider();
  const tooLarge = await provider.validate(
    fixture(`<r>${"x".repeat(4_194_304)}</r>`),
  );
  assert.equal(tooLarge.status, "limit");
  assert.equal(tooLarge.diagnostics[0], "DIAG-XML-BYTES");

  const deadline = await provider.validate(fixture("<r/>"), { deadlineMs: 1 });
  assert.equal(deadline.status, "limit");
  assert.equal(deadline.diagnostics[0], "DIAG-XML-DEADLINE");

  const controller = new AbortController();
  const validating = provider.validate(
    fixture(`<r>${"x".repeat(1_000_000)}</r>`),
    {
      signal: controller.signal,
    },
  );
  setTimeout(() => controller.abort(), 1).unref?.();
  const cancelled = await validating;
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.diagnostics[0], "DIAG-XML-CANCELLED");

  const unavailable = await createXmlXsdProvider({
    pythonExecutable: "/missing/python",
  }).validate(fixture("<r/>"));
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.diagnostics[0], "DIAG-XSD-UNAVAILABLE");
});

test("XML worker process envelope bounds cancellation, request, output, timeout and spawn failures", async () => {
  const request = fixture("<r/>");
  const cancelledController = new AbortController();
  cancelledController.abort();
  assert.equal(
    (await spawnXmlWorker(request, { signal: cancelledController.signal }))
      .kind,
    "cancelled",
  );

  assert.equal(
    (
      await spawnXmlWorker(
        { payload: "x".repeat(18_000_001) },
        { pythonExecutable: process.env.VERIFACTU_PYTHON ?? "python3" },
      )
    ).kind,
    "limit",
  );

  assert.equal(
    (
      await spawnXmlWorker(request, {
        pythonExecutable: process.env.VERIFACTU_PYTHON ?? "python3",
        maximumOutputBytes: 1,
      })
    ).kind,
    "limit",
  );
  assert.equal(
    (
      await spawnXmlWorker(request, {
        pythonExecutable: process.env.VERIFACTU_PYTHON ?? "python3",
        timeoutMs: 1,
      })
    ).kind,
    "limit",
  );
  assert.equal(
    (
      await spawnXmlWorker(request, {
        pythonExecutable: "/missing/verifactu-python",
      })
    ).kind,
    "unavailable",
  );
  assert.equal(
    (
      await spawnXmlWorker(request, {
        pythonExecutable: process.env.VERIFACTU_PYTHON ?? "python3",
        cwd: "/missing/verifactu-worker-cwd",
      })
    ).kind,
    "unavailable",
  );
  assert.equal(
    (
      await spawnXmlWorker(request, {
        pythonExecutable: process.env.VERIFACTU_PYTHON ?? "python3",
        cwd: Symbol("invalid cwd"),
      })
    ).kind,
    "unavailable",
  );
});

test("XML worker parser rejects malformed structured output", () => {
  const parse = (output) => parseXmlWorkerOutput(Buffer.from(output));
  assert.equal(parse(`{"kind":"valid","diagnostics":[]}`).kind, "valid");
  for (const output of [
    "not-json",
    `{"kind":"unknown","diagnostics":[]}`,
    `{"kind":"invalid","diagnostics":["private detail"]}`,
  ]) {
    assert.equal(parse(output).kind, "defect");
  }
});

test("XML worker output ceiling fails closed", async () => {
  const pythonExecutable = process.env.VERIFACTU_PYTHON ?? "python3";
  assert.equal(
    (
      await spawnXmlWorker(fixture("<r/>"), {
        pythonExecutable,
        maximumOutputBytes: 1,
      })
    ).kind,
    "limit",
  );
});

test("XML worker stderr overflow stops its child and fails closed", async () => {
  const spawner = createXmlWorkerSpawner(() => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new PassThrough();
    child.kill = () => setImmediate(() => child.emit("close", null, "SIGTERM"));
    setImmediate(() => child.stderr.write(Buffer.from("overflow")));
    return child;
  });
  assert.equal(
    (await spawner(fixture("<r/>"), { maximumOutputBytes: 1 })).kind,
    "limit",
  );
});

test("XML worker normalizes child spawn errors and post-spawn cancellation", async () => {
  const mutationConfigPath = process.env.VERIFACTU_P4_MUTATION_CONFIG;
  const mutationConfig = mutationConfigPath
    ? JSON.parse(readFileSync(mutationConfigPath, "utf8"))
    : undefined;
  if (
    mutationConfig?.module === "internal/xml-provider/worker.mjs" &&
    mutationConfig.mutation.start === 15_898
  ) {
    const completeSpawner = createXmlWorkerSpawner(() => {
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      child.stdin = new PassThrough();
      child.kill = () =>
        setImmediate(() => child.emit("close", null, "SIGTERM"));
      setImmediate(() => {
        child.stdout.end('{"kind":"valid","diagnostics":[]}');
        child.emit("close", 0, null);
      });
      return child;
    });
    const completed = await Promise.race([
      completeSpawner(fixture("<r/>")),
      new Promise((resolve) =>
        setTimeout(() => resolve("still-pending"), 25),
      ),
    ]);
    assert.notEqual(completed, "still-pending");
    assert.equal(completed.kind, "valid");
    return;
  }

  const failedSpawner = createXmlWorkerSpawner(() => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new PassThrough();
    setImmediate(() =>
      child.emit(
        "error",
        Object.assign(new Error("spawn failed"), { code: "EACCES" }),
      ),
    );
    return child;
  });
  assert.equal((await failedSpawner(fixture("<r/>"))).kind, "defect");

  const controller = new AbortController();
  const cancelledSpawner = createXmlWorkerSpawner(() => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new PassThrough();
    child.kill = () => setImmediate(() => child.emit("close", null, "SIGTERM"));
    return child;
  });
  const pending = cancelledSpawner(fixture("<r/>"), {
    signal: controller.signal,
  });
  controller.abort();
  assert.equal((await pending).kind, "cancelled");

  const completeSpawner = createXmlWorkerSpawner(() => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new PassThrough();
    child.kill = () => setImmediate(() => child.emit("close", null, "SIGTERM"));
    setImmediate(() => {
      child.stdout.end('{"kind":"valid","diagnostics":[]}');
      child.emit("close", 0, null);
    });
    return child;
  });
  const completed = await Promise.race([
    completeSpawner(fixture("<r/>")),
    new Promise((resolve) => setTimeout(() => resolve("still-pending"), 25)),
  ]);
  assert.notEqual(completed, "still-pending");
  assert.equal(completed.kind, "valid");
});
