import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";
import { promisify } from "node:util";
import { spawnDssBridge } from "../../internal/xades-provider/worker.mjs";
import test from "node:test";
import {
  focusedProviderMutationTest,
  mutationTestPatterns,
  mutationCompileFailed,
  javaMutationTestSelections,
} from "../../tooling/assurance/p4-overall-mutation-campaign.mjs";

{
  assert.deepEqual(javaMutationTestSelections({ line: 120 }), [[
    "tests/security/p4-resource-attacks.test.mjs",
    "^(?:Java bridge enforces every top-level request identity and artifact bound|Java bridge fails closed across invalid command, digest, signing and XML request paths)$",
  ]]);
  assert.deepEqual(javaMutationTestSelections({ line: 250 }), [[
    "tests/integration/p4-xades-pki.test.mjs",
    "^(?:revoked is terminal and unknown, absent and malformed never become valid|DSS signs through the opaque callback and validates explicit fresh CRL/OCSP evidence)$",
  ]]);
  assert.deepEqual(javaMutationTestSelections({ line: 420 }), [[
    "tests/security/p4-resource-attacks.test.mjs",
    "^(?:Java XML parser enforces depth, node, attribute and expanded-text limits|Java XML parser traverses bounded comments, text, CDATA and nested elements)$",
  ]]);
  assert.deepEqual(javaMutationTestSelections({ line: 455 }), [[
    "tests/security/p4-signature-attacks.test.mjs",
    "^(?:signed XML rejects wrapping, duplicate IDs, extra references, and entity attacks|DSS rejects each altered XAdES profile component before crypto validation)$",
  ]]);
  assert.deepEqual(javaMutationTestSelections({ line: 145 }), [[
    "tests/security/p4-resource-attacks.test.mjs",
    "^Java bridge fails closed across invalid command, digest, signing and XML request paths$",
  ]]);
  assert.deepEqual(javaMutationTestSelections({ line: 640 }), [[
    "tests/integration/p4-xades-pki.test.mjs",
    "^(?:certificate policy keeps chain, trust, time, use, identity and authorization distinct|revoked is terminal and unknown, absent and malformed never become valid)$",
  ]]);
  assert.deepEqual(javaMutationTestSelections({ line: 760 }), [[
    "tests/security/p4-resource-attacks.test.mjs",
    "^(?:Java bridge turns malformed wire data into a bounded defect response|Java bridge fails closed across invalid command, digest, signing and XML request paths)$",
  ]]);

  const integration = "tests/integration/p4-qr-roundtrip.test.mjs";
  const qr = "packages/verifactu/src/application/qr.ts";
  const patterns = (module, line, test = integration) =>
    mutationTestPatterns({ module, line }, test).map(
      (entry) => entry.pattern,
    );

  assert.deepEqual(patterns(qr, 100), [
    "^(?:P4-MUT-(?:030|031|042|043)|P4-FAULT-QR-(?:ENVIRONMENT|TRUNCATION))",
    "^P4-PROP-011",
    "^P4-FUZZ-005",
  ]);
  assert.deepEqual(patterns(qr, 200), [
    "^(?:P4-MUT-(?:030|031|042|043)|P4-FAULT-QR-(?:ENVIRONMENT|TRUNCATION))",
  ]);
  assert.deepEqual(patterns(qr, 250), [
    "^(?:P4-MUT-(?:030|031|042|043)|P4-FAULT-QR-(?:ENVIRONMENT|TRUNCATION))",
  ]);
  assert.deepEqual(patterns(qr, 400), [
    "^P4-E PNG renderer is deterministic, bounded and independently decodable$",
  ]);
  assert.deepEqual(patterns(qr, 285), [
    "^P4-E PNG renderer is deterministic, bounded and independently decodable$",
  ]);
  assert.deepEqual(patterns("packages/verifactu/src/domain/records.ts", 40), [
    "^P4-PROP-011",
  ]);
  assert.deepEqual(
    patterns(qr, 250, "tests/contract/p4-qr-provider.test.mjs"),
    [
      "^(?:P4-E rejects cross-edition payloads, oversized fields and render bounds|P4-E rejects malformed encoder ports, matrices and render option boundaries|P4-E deterministic PNG supports multi-block bounded rasters|P4-E PNG encodes exact raster pixels, physical density and chunk checksums)$",
    ],
  );
  assert.deepEqual(
    patterns(qr, 100, "tests/contract/p4-qr-provider.test.mjs"),
    [
      "^(?:P4-E payload binds canonical ordered query and mode endpoint|P4-E rejects cross-edition payloads, oversized fields and render bounds|P4-E rejects forged record facts, unsupported QR lexicals and digest failures|P4-E malformed verifier and edition identities fail closed)$",
    ],
  );
  assert.deepEqual(
    patterns(qr, 320, "tests/contract/p4-qr-provider.test.mjs"),
    [
      "^(?:P4-E rejects malformed encoder ports, matrices and render option boundaries|P4-E deterministic PNG supports multi-block bounded rasters|P4-E PNG encodes exact raster pixels, physical density and chunk checksums)$",
    ],
  );
  assert.deepEqual(
    patterns(qr, 320, "tests/integration/p4-qr-roundtrip.test.mjs"),
    ["^P4-E PNG renderer is deterministic, bounded and independently decodable$"],
  );
  assert.equal(
    focusedProviderMutationTest({
      module: "internal/xml-provider/provider.mjs",
      line: 213,
    }),
    "tests/contract/p4-xml-xsd-provider.test.mjs",
  );
  assert.equal(
    focusedProviderMutationTest({
      module: "packages/verifactu/src/verification/engine-adapter.ts",
      line: 54,
    }),
    "tests/contract/p4-engine-adapter.test.mjs [--test-name-pattern=^engine evidence rejects null shaped record and chain summaries$]",
  );
  assert.equal(
    focusedProviderMutationTest({
      module: "internal/xades-provider/provider.mjs",
      line: 96,
    }),
    "tests/contract/p4-xades-provider.test.mjs",
  );
  assert.equal(
    focusedProviderMutationTest({
      module: "internal/xades-provider/provider.mjs",
      line: 623,
    }),
    "tests/contract/p4-xades-provider.test.mjs",
  );
  assert.equal(
    focusedProviderMutationTest({
      module: "internal/xades-provider/pki.mjs",
      line: 60,
    }),
    "tests/integration/p4-xades-pki.test.mjs [--test-name-pattern=^(?:revoked is terminal and unknown, absent and malformed never become valid|PKI observation requires evidence and a fresh caller-time interval)$]",
  );
  assert.equal(
    focusedProviderMutationTest({
      module: "internal/xades-provider/provider.mjs",
      line: 326,
    }),
    "tests/contract/p4-xades-provider.test.mjs",
  );
  assert.equal(
    focusedProviderMutationTest({
      module: "internal/xades-provider/worker.mjs",
      line: 280,
    }),
    "tests/security/p4-resource-attacks.test.mjs [--test-name-pattern=^DSS response decoder rejects malformed framing and validates every field$]",
  );
  assert.equal(
    focusedProviderMutationTest({
      module: "internal/xml-provider/worker.mjs",
      line: 370,
    }),
    "tests/security/p4-xml-attacks.test.mjs",
  );
  assert.equal(
    focusedProviderMutationTest({
      module: "internal/xades-provider/provider.mjs",
      line: 693,
    }),
    "tests/contract/p4-xades-provider.test.mjs",
  );
  assert.equal(
    mutationCompileFailed(
      "P4_MUTATION_ACTIVE:P4-OM-example:\nSyntaxError: Invalid regular expression",
      true,
    ),
    false,
  );
  assert.equal(
    mutationCompileFailed("P4_MUTATION_TYPESCRIPT_EMIT: invalid syntax", false),
    true,
  );
}

const built = resolve("evidence/runs/artifacts/build/verifactu/dist");
const xmlSchemaSourceRoot = resolve(
  "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources",
);
const xmlSchemaPaths = {
  "xsd-suministro-informacion": "aeat/SuministroInformacion.xsd",
  "xmldsig-schema": "standards/xmldsig-core-schema.xsd",
};
let serial = 0;

async function mutation(id, control, module, before, after, observe) {
  const temporary = await mkdtemp(join(tmpdir(), "verifactu-p4-mutation-"));
  try {
    const dist = join(temporary, "dist");
    await cp(built, dist, { recursive: true });
    const internal = join(temporary, "internal");
    await cp(resolve("internal/xml-provider"), join(internal, "xml-provider"), {
      recursive: true,
    });
    const xades = join(internal, "xades-provider");
    await mkdir(xades, { recursive: true });
    for (const name of ["provider.mjs", "pki.mjs", "worker.mjs"])
      await cp(resolve("internal/xades-provider", name), join(xades, name));
    await writeFile(join(temporary, "package.json"), '{"type":"module"}\n');
    const admittedEngine = join(
      temporary,
      "node_modules",
      "@noeos",
      "verification-engine",
    );
    await mkdir(join(temporary, "node_modules", "@noeos"), { recursive: true });
    await cp(
      resolve("node_modules/@noeos/verification-engine"),
      admittedEngine,
      { recursive: true },
    );
    const javaSource = module.endsWith(".java");
    const target = javaSource
      ? join(temporary, "mutated", module)
      : module.startsWith("internal/")
        ? join(temporary, module)
        : join(dist, module);
    const original = await readFile(
      javaSource ? resolve(module) : target,
      "utf8",
    );
    const edits = Array.isArray(before) ? before : [{ before, after }];
    let mutated = original;
    for (const edit of edits) {
      assert(
        mutated.includes(edit.before),
        `mutation source span missing: ${module}`,
      );
      mutated = mutated.replace(edit.before, edit.after);
    }
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, mutated);
    let jarPath;
    if (javaSource) {
      const javaHome = process.env.JAVA_HOME;
      const jar =
        process.env.VERIFACTU_DSS_JAR ??
        resolve(
          "internal/xades-provider/dss/target/verifactu-xades-provider-0.0.0-development.jar",
        );
      assert.ok(javaHome, "P4-D mutation requires the admitted JAVA_HOME");
      const classes = join(temporary, "mutated-classes");
      await mkdir(classes);
      const javac = join(
        javaHome,
        "bin",
        process.platform === "win32" ? "javac.exe" : "javac",
      );
      await promisify(execFile)(javac, [
        "--release",
        "21",
        "-cp",
        jar,
        "-d",
        classes,
        target,
      ]);
      jarPath = `${classes}${process.platform === "win32" ? ";" : ":"}${jar}`;
    }
    const load = async (path) => {
      const base = path.startsWith("internal/") ? temporary : dist;
      return import(
        `${pathToFileURL(join(base, path)).href}?mutation=${serial++}`
      );
    };
    try {
      await observe({ dist, load, temporary, jarPath });
    } catch (error) {
      assert.equal(
        error?.code,
        "ERR_ASSERTION",
        `${id} failed outside its oracle`,
      );
      assert.match(
        error.message,
        new RegExp(control),
        `${id} was killed by the wrong assertion`,
      );
      return;
    }
    assert.fail(`${id} survived its registered behavioral oracle`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function contextFor(load) {
  const { createIdentity } = await load("domain/identities.js");
  const { createFiscalContext } = await load("domain/context.js");
  const id = (kind, value) => createIdentity(kind, value).value;
  return {
    id,
    context: createFiscalContext({
      tenantId: id("tenant", "mutation-tenant"),
      taxpayerId: id("taxpayer", "mutation-taxpayer"),
      installationId: id("installation", "mutation-installation"),
      editionId: id("edition", "mutation-edition"),
    }).value,
  };
}

function xsdFaultRequest(xml, pinnedSchemas) {
  return {
    editionId: "rrsif-2026-09-21-authoritative-candidate",
    xml: Buffer.from(xml, "utf8"),
    rootSchemaId: "xsd-suministro-informacion",
    schemas: Object.entries(xmlSchemaPaths).map(([id, path]) => ({
      id,
      bytes: readFileSync(join(xmlSchemaSourceRoot, path)),
      sha256: pinnedSchemas[id].sha256,
    })),
    semanticStatus: "not-evaluated",
  };
}

const date = "2025-01-01";
const at = "2025-01-01T00:00:00Z";
const xadesBytes = new TextEncoder().encode("<RegistroAlta/>");
const xadesValid = {
  editionId: "rrsif-2026-09-21-authoritative-candidate",
  profileId: "AEAT-XADES-EPES-v0.1.5",
  targetName: "RegistroAlta",
  artifactBytes: xadesBytes,
  artifactDigestSha256: createHash("sha256").update(xadesBytes).digest("hex"),
  signingTime: "2026-09-26T12:00:00Z",
  validationTime: "2026-09-26T12:00:00Z",
  maximumRevocationAgeSeconds: 3_600,
  trustAnchorsDer: [new Uint8Array([1])],
  crlEvidence: [new Uint8Array([2])],
  ocspEvidence: [],
};

function officialSignedVector() {
  const archive = readFileSync(
    "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources/aeat/AnexosEjemplosFirmaRegFact.zip",
  );
  const end = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.notEqual(end, -1);
  let offset = archive.readUInt32LE(end + 16);
  const entries = archive.readUInt16LE(end + 10);
  for (let index = 0; index < entries; index += 1) {
    assert.equal(archive.readUInt32LE(offset), 0x02014b50);
    const compressedBytes = archive.readUInt32LE(offset + 20);
    const nameBytes = archive.readUInt16LE(offset + 28);
    const extraBytes = archive.readUInt16LE(offset + 30);
    const commentBytes = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.toString("utf8", offset + 46, offset + 46 + nameBytes);
    if (name === "ejemploRegistro-firmado-epes-xades4j.xml") {
      const body =
        localOffset +
        30 +
        archive.readUInt16LE(localOffset + 26) +
        archive.readUInt16LE(localOffset + 28);
      return new Uint8Array(
        inflateRawSync(archive.subarray(body, body + compressedBytes)),
      );
    }
    offset += 46 + nameBytes + extraBytes + commentBytes;
  }
  assert.fail("official XAdES vector missing");
}

async function verifyWithBridge(artifactBytes, jarPath) {
  const { createXadesProvider, XADES_EDITION_ID, XADES_PROFILE_ID } =
    await import("../../internal/xades-provider/provider.mjs");
  const provider = createXadesProvider({
    execute: (request, options) =>
      spawnDssBridge(request, { ...options, jarPath }),
  });
  return provider.verify({
    editionId: XADES_EDITION_ID,
    profileId: XADES_PROFILE_ID,
    targetName: "RegistroAlta",
    artifactBytes,
    artifactDigestSha256: createHash("sha256")
      .update(artifactBytes)
      .digest("hex"),
    trustAnchorsDer: [],
    crlEvidence: [],
    ocspEvidence: [],
    validationTime: "2025-02-04T00:00:00Z",
    maximumRevocationAgeSeconds: 86_400,
  });
}
const digestPort = {
  providerId: "test:node-crypto",
  digest: (algorithm, bytes) =>
    createHash(algorithm).update(bytes).digest("hex"),
};
const digest = (bytes) =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

test("P4-MUT-001 kills a skipped domain codec stage", async () => {
  await mutation(
    "P4-MUT-001",
    "P4-CB-001",
    "contracts/staged-codec.js",
    "if (!runCheck(schema.validateDomain, value))",
    "if (false && !runCheck(schema.validateDomain, value))",
    async ({ load }) => {
      const { decodeJson } = await load("contracts/staged-codec.js");
      const result = decodeJson(
        new TextEncoder().encode('{"id":"x","kind":"alta"}'),
        { required: ["id", "kind"], validateDomain: () => false },
      );
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-001 domain-stage assertion",
      );
    },
  );
});

test("P4-MUT-002 kills duplicate JSON member acceptance", async () => {
  await mutation(
    "P4-MUT-002",
    "P4-CB-002",
    "contracts/staged-codec.js",
    "if (Object.hasOwn(out, key))",
    "if (false && Object.hasOwn(out, key))",
    async ({ load }) => {
      const { decodeJson } = await load("contracts/staged-codec.js");
      const result = decodeJson(
        new TextEncoder().encode('{"id":"first","id":"second","kind":"alta"}'),
        { required: ["id", "kind"] },
      );
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-002 duplicate-member assertion",
      );
    },
  );
});

test("P4-MUT-003 kills cross-kind identity substitution", async () => {
  await mutation(
    "P4-MUT-003",
    "P4-CB-003",
    "domain/identities.js",
    "candidate.kind === kind",
    "true",
    async ({ load }) => {
      const { isIdentity } = await load("domain/identities.js");
      assert.equal(
        isIdentity({ kind: "taxpayer", value: "x" }, "tenant"),
        false,
        "P4-CB-003 identity-kind assertion",
      );
    },
  );
});

test("P4-MUT-004 kills omitted fiscal context identity", async () => {
  await mutation(
    "P4-MUT-004",
    "P4-CB-004",
    "domain/context.js",
    '!isIdentity(input.editionId, "edition")',
    "false",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const get = (kind) => createIdentity(kind, "x").value;
      const result = createFiscalContext({
        tenantId: get("tenant"),
        taxpayerId: get("taxpayer"),
        installationId: get("installation"),
        editionId: null,
      });
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-004 context completeness assertion",
      );
    },
  );
});

test("P4-MUT-005 kills floating-point decimal coercion", async () => {
  await mutation(
    "P4-MUT-005",
    "P4-CB-005",
    "domain/decimal.js",
    "!Number.isSafeInteger(value) || Object.is(value, -0)",
    "Object.is(value, -0)",
    async ({ load }) => {
      const { decimalFromNumber } = await load("domain/decimal.js");
      const result = decimalFromNumber(1.5, {
        maxIntegerDigits: 3,
        maxScale: 2,
      });
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-005 unsafe number assertion",
      );
    },
  );
});

test("P4-MUT-006 kills an instant without an explicit offset", async () => {
  await mutation(
    "P4-MUT-006",
    "P4-CB-006",
    "domain/date-time.js",
    "(Z|[+-]\\d{2}:(\\d{2}))$",
    "(Z|[+-]\\d{2}:(\\d{2}))?$",
    async ({ load }) => {
      const { createFiscalInstant } = await load("domain/date-time.js");
      let result;
      assert.doesNotThrow(() => {
        result = createFiscalInstant("2025-01-01T12:00:00");
      }, "P4-CB-006 instant rejection remains total");
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-006 explicit-offset assertion",
      );
    },
  );
});

test("P4-FAULT-006 detects an implicit wall-clock read", async () => {
  await mutation(
    "P4-FAULT-006",
    "P4-FAULT-006",
    "domain/date-time.js",
    '!Number.isFinite(Date.parse(value)))\n        return invalid("DIAG-INSTANT-INVALID", "domain");\n    return ok(value);',
    '!Number.isFinite(Date.parse(value)))\n        return invalid("DIAG-INSTANT-INVALID", "domain");\n    return ok(new Date().toISOString());',
    async ({ load }) => {
      const { createFiscalInstant } = await load("domain/date-time.js");
      const input = "2025-01-01T12:00:00Z";
      const result = createFiscalInstant(input);
      assert.equal(
        result.value,
        input,
        "P4-FAULT-006 explicit-time determinism",
      );
    },
  );
});

test("P4-MUT-007 kills record kind confusion", async () => {
  await mutation(
    "P4-MUT-007",
    "P4-CB-007",
    "domain/records.js",
    'input.kind !== "alta" ||',
    "false ||",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const { createFiscalDate, createFiscalInstant } = await load(
        "domain/date-time.js",
      );
      const { createDecimal } = await load("domain/decimal.js");
      const { createAltaRecord } = await load("domain/records.js");
      const get = (kind, value) => createIdentity(kind, value).value;
      const taxpayer = get("taxpayer", "taxpayer");
      const context = createFiscalContext({
        tenantId: get("tenant", "tenant"),
        taxpayerId: taxpayer,
        installationId: get("installation", "installation"),
        editionId: get("edition", "edition"),
      }).value;
      const result = createAltaRecord({
        kind: "anulacion",
        id: get("record", "record"),
        context,
        document: {
          issuer: taxpayer,
          series: "A",
          number: "1",
          issueDate: date,
        },
        issueDate: createFiscalDate(date).value,
        generatedAt: createFiscalInstant(at).value,
        total: createDecimal("1", { maxIntegerDigits: 2, maxScale: 0 }).value,
        predecessorId: null,
        editionId: context.editionId,
      });
      assert.equal(result.status, "invalid", "P4-CB-007 record-kind assertion");
    },
  );
});

test("P4-MUT-008 kills correction history loss", async () => {
  await mutation(
    "P4-MUT-008",
    "P4-CB-008",
    "domain/corrections.js",
    "...graph.relations,",
    "...graph.relations.slice(1),",
    async ({ load }) => {
      const { createIdentity, createFiscalDocumentIdentity } = await load(
        "domain/identities.js",
      );
      const { createFiscalContext } = await load("domain/context.js");
      const { addCorrection } = await load("domain/corrections.js");
      const get = (kind, value) => createIdentity(kind, value).value;
      const taxpayer = get("taxpayer", "taxpayer");
      const context = createFiscalContext({
        tenantId: get("tenant", "tenant"),
        taxpayerId: taxpayer,
        installationId: get("installation", "installation"),
        editionId: get("edition", "edition"),
      }).value;
      const doc = (number) =>
        createFiscalDocumentIdentity({
          issuer: taxpayer,
          series: "A",
          number,
          issueDate: date,
        }).value;
      const first = addCorrection(
        { relations: [] },
        {
          kind: "correction",
          context,
          source: doc("2"),
          target: doc("1"),
          evidenceId: "first",
        },
      );
      const result = addCorrection(first.value, {
        kind: "substitution",
        context,
        source: doc("3"),
        target: doc("2"),
        evidenceId: "second",
      });
      assert.equal(result.status, "ok");
      assert.equal(
        result.value.relations.length,
        2,
        "P4-CB-008 history assertion",
      );
    },
  );
});

test("P4-MUT-009 kills unapproved mode rollback", async () => {
  await mutation(
    "P4-MUT-009",
    "P4-CB-009",
    "domain/mode-tenure.js",
    "!allowRollback",
    "false && !allowRollback",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const { transitionMode } = await load("domain/mode-tenure.js");
      const get = (kind) => createIdentity(kind, "x").value;
      const context = createFiscalContext({
        tenantId: get("tenant"),
        taxpayerId: get("taxpayer"),
        installationId: get("installation"),
        editionId: get("edition"),
      }).value;
      const previous = {
        context,
        mode: "verifactu",
        effectiveFrom: "2024-01-01T00:00:00Z",
        effectiveUntil: "2025-01-01T00:00:00Z",
        authorizationId: "auth",
        evidenceId: "evidence",
      };
      const result = transitionMode(previous, {
        ...previous,
        mode: "nonVerifactu",
        effectiveFrom: "2025-01-01T00:00:00Z",
        effectiveUntil: null,
      });
      assert.equal(result.status, "invalid", "P4-CB-009 rollback assertion");
    },
  );
});

test("P4-MUT-010 kills inclusive mode tenure end time", async () => {
  await mutation(
    "P4-MUT-010",
    "P4-CB-010",
    "domain/mode-tenure.js",
    "Date.parse(at) < Date.parse(t.effectiveUntil)",
    "Date.parse(at) <= Date.parse(t.effectiveUntil)",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const { resolveMode } = await load("domain/mode-tenure.js");
      const get = (kind) => createIdentity(kind, "x").value;
      const context = createFiscalContext({
        tenantId: get("tenant"),
        taxpayerId: get("taxpayer"),
        installationId: get("installation"),
        editionId: get("edition"),
      }).value;
      const tenure = {
        context,
        mode: "nonVerifactu",
        effectiveFrom: "2025-01-01T00:00:00Z",
        effectiveUntil: "2025-01-02T00:00:00Z",
        authorizationId: "auth",
        evidenceId: "evidence",
      };
      assert.equal(
        resolveMode([tenure], tenure.effectiveUntil, context).status,
        "indeterminate",
        "P4-CB-010 effective-end assertion",
      );
    },
  );
});

test("P4-MUT-011 kills mixed regulated-event predecessor identity", async () => {
  await mutation(
    "P4-MUT-011",
    "P4-CB-011",
    "domain/events.js",
    "!sameIdentity(event.previousEventId, previous.id)",
    "false",
    async ({ load }) => {
      const { createIdentity } = await load("domain/identities.js");
      const { createFiscalContext } = await load("domain/context.js");
      const { appendEvent } = await load("domain/events.js");
      const get = (kind, value) => createIdentity(kind, value).value;
      const context = createFiscalContext({
        tenantId: get("tenant", "tenant"),
        taxpayerId: get("taxpayer", "taxpayer"),
        installationId: get("installation", "installation"),
        editionId: get("edition", "edition"),
      }).value;
      const first = {
        id: get("event", "event-1"),
        context,
        code: "START",
        occurredAt: at,
        observedAt: at,
        previousEventId: null,
      };
      const sequence = appendEvent({ context, events: [] }, first).value;
      const second = {
        ...first,
        id: get("event", "event-2"),
        occurredAt: "2025-01-02T00:00:00Z",
        previousEventId: get("event", "foreign-event"),
      };
      const result = appendEvent(sequence, second);
      assert.equal(result.status, "invalid", "P4-CB-011 event-chain assertion");
    },
  );
});

test("P4-MUT-012 kills collapsed terminal outcomes", async () => {
  await mutation(
    "P4-MUT-012",
    "P4-CB-012",
    "domain/states.js",
    "return TERMINAL_OUTCOMES.includes(value);",
    'return value === "accepted";',
    async ({ load }) => {
      const { isTerminalOutcome } = await load("domain/states.js");
      assert.equal(
        isTerminalOutcome("rejected"),
        true,
        "P4-CB-012 terminal outcome distinction assertion",
      );
    },
  );
});

test("P4-MUT-013 kills indeterminate construction advancing a chain", async () => {
  await mutation(
    "P4-MUT-013",
    "P4-CB-013",
    "domain/invariants.js",
    'outcome.status === "accepted"',
    'outcome.status !== "rejected"',
    async ({ load }) => {
      const fixture = await contextFor(load);
      const { chainEligible } = await load("domain/invariants.js");
      const result = chainEligible(
        {
          status: "indeterminate",
          diagnostics: [],
          requiredEvidence: ["evidence"],
          value: { context: fixture.context },
        },
        fixture.context,
      );
      assert.equal(result, false, "P4-CB-013 chain eligibility assertion");
    },
  );
});

test("P4-MUT-014 kills out-of-order billing sequence acceptance", async () => {
  await mutation(
    "P4-MUT-014",
    "P4-CB-014",
    "domain/sequences.js",
    "Date.parse(item.occurredAt) < Date.parse(previous.occurredAt)",
    "false",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { appendSequence } = await load("domain/sequences.js");
      const first = {
        id: id("record", "record-1"),
        context,
        occurredAt: "2025-01-02T00:00:00Z",
        predecessorId: null,
      };
      const sequence = appendSequence({ context, records: [] }, first).value;
      const result = appendSequence(sequence, {
        ...first,
        id: id("record", "record-2"),
        occurredAt: at,
        predecessorId: first.id,
      });
      assert.equal(result.status, "invalid", "P4-CB-014 chronology assertion");
    },
  );
});

test("P4-MUT-015 kills swapped predecessor and current digest fields", async () => {
  await mutation(
    "P4-MUT-015",
    "P4-CB-015",
    "domain/chains.js",
    "recordId,\n        previousDigest,\n        currentDigest,",
    "recordId,\n        previousDigest: currentDigest,\n        currentDigest: previousDigest,",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createChainLink } = await load("domain/chains.js");
      const input = new TextEncoder().encode("record-bytes");
      const result = createChainLink(
        context,
        id("record", "record-1"),
        null,
        input,
        digest,
      );
      assert.equal(
        result.value.previousDigest,
        null,
        "P4-CB-015 genesis predecessor assertion",
      );
      assert.equal(
        result.value.currentDigest,
        digest(input),
        "P4-CB-015 current digest assertion",
      );
    },
  );
});

test("P4-MUT-016 kills duplicate complete-chain fork acceptance", async () => {
  await mutation(
    "P4-MUT-016",
    "P4-CB-016",
    "domain/chains.js",
    "if (records.has(key))",
    "if (false && records.has(key))",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createChainLink, verifyCompleteChain } =
        await load("domain/chains.js");
      const input = new TextEncoder().encode("record-bytes");
      const link = createChainLink(
        context,
        id("record", "record-1"),
        null,
        input,
        digest,
      ).value;
      const result = verifyCompleteChain(
        [link, link],
        new Map([[link.recordId.value, input]]),
        context,
        link.currentDigest,
        digest,
      );
      assert.equal(result.code, "DIAG-CHAIN-FORK", "P4-CB-016 fork assertion");
    },
  );
});

test("P4-MUT-017 kills undeclared plan effect acceptance", async () => {
  await mutation(
    "P4-MUT-017",
    "P4-CB-017",
    "application/operation-plan.js",
    "input.effects.length !== 0",
    "false",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createOperationPlan } = await load(
        "application/operation-plan.js",
      );
      const result = createOperationPlan({
        operationId: id("operation", "op"),
        context,
        editionId: context.editionId,
        expectedHead: null,
        expiresAt: at,
        actions: ["validate"],
        effects: ["network"],
      });
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-017 undeclared effect assertion",
      );
    },
  );
});

test("P4-MUT-018 kills mutable plan output", async () => {
  await mutation(
    "P4-MUT-018",
    "P4-CB-018",
    "application/record-planner.js",
    "return ok(Object.freeze({",
    "return ok(({",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createDecimal } = await load("domain/decimal.js");
      const { createAltaRecord } = await load("domain/records.js");
      const { planRecord } = await load("application/record-planner.js");
      const record = createAltaRecord({
        kind: "alta",
        id: id("record", "r"),
        context,
        document: {
          issuer: context.taxpayerId,
          series: "s",
          number: "n",
          issueDate: date,
        },
        issueDate: date,
        generatedAt: at,
        total: createDecimal("1", { maxIntegerDigits: 3, maxScale: 2 }).value,
        predecessorId: null,
        editionId: context.editionId,
      }).value;
      const plan = planRecord({
        record,
        operationId: id("operation", "op"),
        expectedHead: null,
        expiresAt: at,
        digest: digestPort,
      }).value;
      assert.equal(
        Object.isFrozen(plan),
        true,
        "P4-CB-018 immutable plan assertion",
      );
    },
  );
});

test("P4-MUT-019 kills undeclared absence in official projection", async () => {
  await mutation(
    "P4-MUT-019",
    "P4-CB-019",
    "application/official-projection.js",
    "field.allowAbsent !== true",
    "false",
    async ({ load }) => {
      const { projectOfficialFields } = await load(
        "application/official-projection.js",
      );
      assert.equal(
        projectOfficialFields([
          { name: "A", order: 0, value: { presence: "absent" } },
        ]).status,
        "invalid",
        "P4-CB-019 absence assertion",
      );
    },
  );
});

test("P4-MUT-020 kills official separator drift", async () => {
  await mutation(
    "P4-MUT-020",
    "P4-CB-020",
    "application/official-serialization.js",
    "rule.separator + lexical",
    '"" + lexical',
    async ({ load }) => {
      const { serializeOfficialProjection } = await load(
        "application/official-serialization.js",
      );
      const result = serializeOfficialProjection(
        [{ name: "A", order: 0, presence: "value", value: "1" }],
        {
          editionId: { kind: "edition", value: "e" },
          label: "FP",
          separator: "&",
          encoding: "utf-8",
          fields: ["A"],
        },
      );
      assert.equal(
        result.value.text,
        "FP&1",
        "P4-CB-020 official separator assertion",
      );
    },
  );
});

test("P4-MUT-021 kills a fingerprint edition mismatch", async () => {
  await mutation(
    "P4-MUT-021",
    "P4-CB-021",
    "application/fingerprint.js",
    "input.rule.editionId.value !== input.editionId.value",
    "false",
    async ({ load }) => {
      const { id } = await contextFor(load);
      const { createFingerprint } = await load("application/fingerprint.js");
      assert.equal(
        createFingerprint({
          editionId: id("edition", "e"),
          expectedEditionId: id("edition", "e"),
          algorithm: "sha256",
          fields: [{ name: "A", order: 0, presence: "value", value: "1" }],
          rule: {
            editionId: id("edition", "other"),
            label: "FP",
            separator: "&",
            encoding: "utf-8",
            fields: ["A"],
          },
          digest: digestPort,
        }).status,
        "invalid",
        "P4-CB-021 algorithm allowlist assertion",
      );
    },
  );
});

test("P4-FAULT-ENCODING rejects an unadmitted encoding change", async () => {
  await mutation(
    "P4-FAULT-ENCODING",
    "P4-FAULT-ENCODING",
    "application/official-serialization.js",
    'rule.encoding !== "utf-8"',
    "false",
    async ({ load }) => {
      const { serializeOfficialProjection } = await load(
        "application/official-serialization.js",
      );
      const result = serializeOfficialProjection(
        [{ name: "A", order: 0, presence: "value", value: "1" }],
        {
          editionId: { kind: "edition", value: "e" },
          label: "FP",
          separator: "&",
          encoding: "utf-16le",
          fields: ["A"],
        },
      );
      assert.equal(
        result.status,
        "invalid",
        "P4-FAULT-ENCODING rejects encoding changes",
      );
    },
  );
});

test("P4-FAULT-ENGINE-VERSION rejects a swapped Engine profile version", async () => {
  await mutation(
    "P4-FAULT-ENGINE-VERSION",
    "P4-FAULT-ENGINE-VERSION",
    "verification/engine-profile.js",
    "version: ENGINE_PROFILE_VERSION",
    'version: "2.0.0"',
    async ({ load }) => {
      const { ENGINE_PROFILE_MANIFEST } = await load(
        "verification/engine-profile.js",
      );
      assert.equal(
        ENGINE_PROFILE_MANIFEST.version,
        "1.0.0",
        "P4-FAULT-ENGINE-VERSION exact profile version assertion",
      );
    },
  );
});

test("P4-FAULT-XSD-CRASH-VALID keeps worker crashes non-valid", async () => {
  await mutation(
    "P4-FAULT-XSD-CRASH-VALID",
    "P4-FAULT-XSD-CRASH-VALID",
    "internal/xml-provider/provider.mjs",
    [
      {
        before:
          '} catch {\n    return outcome("defect", "not-evaluated", semantic, ["DIAG-XSD-PROVIDER"]);\n  }\n}',
        after:
          '} catch {\n    return outcome("valid", "valid", semantic, []);\n  }\n}',
      },
    ],
    undefined,
    async ({ load }) => {
      const { createXmlXsdProvider, PINNED_SCHEMAS } = await load(
        "internal/xml-provider/provider.mjs",
      );
      const result = await createXmlXsdProvider({
        execute: async () => {
          throw new Error("seeded worker crash");
        },
      }).validate(xsdFaultRequest("<RegistroAlta/>", PINNED_SCHEMAS));
      assert.notEqual(
        result.status,
        "valid",
        "P4-FAULT-XSD-CRASH-VALID worker crash cannot prove validity",
      );
    },
  );
});

test("P4-MUT-022 kills exact artifact byte custody substitution", async () => {
  await mutation(
    "P4-MUT-022",
    "P4-CB-022",
    "application/xml-artifacts.js",
    "Boolean(originalBytes) &&\n        originalBytes !== undefined &&\n        bytesEqual(expectedBytes, originalBytes)",
    "true",
    async ({ load }) => {
      const { id, context } = await contextFor(load);
      const { createHash } = await import("node:crypto");
      const { createXmlArtifact, transitionXmlArtifact } = await load(
        "application/xml-artifacts.js",
      );
      const original = new TextEncoder().encode("123456789");
      const artifact = createXmlArtifact(
        {
          artifactId: "a",
          context,
          editionId: context.editionId,
          kind: "xml",
          mediaType: "application/xml",
          bytes: original,
          parentIds: [],
          transform: "serialize",
          state: "produced",
        },
        digestPort,
      ).value;
      const replacement = new TextEncoder().encode("987654321");
      const tampered = {
        ...artifact,
        bytes: replacement,
        sha256:
          "sha256:" + createHash("sha256").update(replacement).digest("hex"),
        sha512:
          "sha512:" + createHash("sha512").update(replacement).digest("hex"),
      };
      assert.equal(
        transitionXmlArtifact(
          tampered,
          "bounded-and-digested",
          replacement,
          digestPort,
        ).status,
        "invalid",
        "P4-CB-022 byte custody assertion",
      );
    },
  );
});

test("P4-MUT-023 kills a permissive DTD and entity declaration policy", async () => {
  await mutation(
    "P4-MUT-023",
    "P4-CB-023",
    "internal/xml-provider/worker.mjs",
    "if docinfo.doctype or docinfo.internalDTD is not None or docinfo.externalDTD is not None:",
    "if False:",
    async ({ load }) => {
      const { createXmlXsdProvider, PINNED_SCHEMAS, XML_EDITION_ID } =
        await load("internal/xml-provider/provider.mjs");
      const base = resolve(
        "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources",
      );
      const schemas = [
        {
          id: "xsd-suministro-informacion",
          bytes: await readFile(join(base, "aeat/SuministroInformacion.xsd")),
          sha256: PINNED_SCHEMAS["xsd-suministro-informacion"].sha256,
        },
        {
          id: "xmldsig-schema",
          bytes: await readFile(
            join(base, "standards/xmldsig-core-schema.xsd"),
          ),
          sha256: PINNED_SCHEMAS["xmldsig-schema"].sha256,
        },
      ];
      const result = await createXmlXsdProvider().validate({
        editionId: XML_EDITION_ID,
        rootSchemaId: "xsd-suministro-informacion",
        schemas,
        xml: Buffer.from("<!DOCTYPE RegistroAlta><RegistroAlta/>", "utf8"),
      });
      assert.equal(
        result.diagnostics[0],
        "DIAG-XML-DOCTYPE",
        "P4-CB-023 DTD rejection assertion",
      );
    },
  );
});

test("P4-MUT-024 kills missing in-parse node-count enforcement", async () => {
  await mutation(
    "P4-MUT-024",
    "P4-CB-024",
    "internal/xml-provider/worker.mjs",
    "nodes += 1\n                attributes += len(item.attrib)",
    "nodes += 0\n                attributes += len(item.attrib)",
    async ({ load }) => {
      const { createXmlXsdProvider, PINNED_SCHEMAS, XML_EDITION_ID } =
        await load("internal/xml-provider/provider.mjs");
      const base = resolve(
        "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources",
      );
      const schemas = [
        {
          id: "xsd-suministro-informacion",
          bytes: await readFile(join(base, "aeat/SuministroInformacion.xsd")),
          sha256: PINNED_SCHEMAS["xsd-suministro-informacion"].sha256,
        },
        {
          id: "xmldsig-schema",
          bytes: await readFile(
            join(base, "standards/xmldsig-core-schema.xsd"),
          ),
          sha256: PINNED_SCHEMAS["xmldsig-schema"].sha256,
        },
      ];
      const xml = Buffer.from(`<r>${"<n/>".repeat(100_001)}</r>`, "utf8");
      const result = await createXmlXsdProvider().validate({
        editionId: XML_EDITION_ID,
        rootSchemaId: "xsd-suministro-informacion",
        schemas,
        xml,
      });
      assert.equal(result.status, "limit", "P4-CB-024 limit status assertion");
      assert.equal(
        result.diagnostics[0],
        "DIAG-XML-NODES",
        "P4-CB-024 node-count assertion",
      );
    },
  );
});

test("P4-MUT-025 kills semantic-validity promotion by the XSD provider", async () => {
  await mutation(
    "P4-MUT-025",
    "P4-CB-025",
    "internal/xml-provider/provider.mjs",
    'return outcome("valid", "valid", semantic, []);',
    'return outcome("valid", "valid", "valid", []);',
    async ({ load }) => {
      const { createXmlXsdProvider, PINNED_SCHEMAS, XML_EDITION_ID } =
        await load("internal/xml-provider/provider.mjs");
      const base = resolve(
        "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources",
      );
      const schemas = [
        {
          id: "xsd-suministro-informacion",
          bytes: await readFile(join(base, "aeat/SuministroInformacion.xsd")),
          sha256: PINNED_SCHEMAS["xsd-suministro-informacion"].sha256,
        },
        {
          id: "xmldsig-schema",
          bytes: await readFile(
            join(base, "standards/xmldsig-core-schema.xsd"),
          ),
          sha256: PINNED_SCHEMAS["xmldsig-schema"].sha256,
        },
      ];
      const result = await createXmlXsdProvider({
        execute: async () => ({ kind: "valid", diagnostics: [] }),
      }).validate({
        editionId: XML_EDITION_ID,
        rootSchemaId: "xsd-suministro-informacion",
        schemas,
        xml: Buffer.from("<valid/>", "utf8"),
        semanticStatus: "invalid",
      });
      assert.equal(
        result.semantic,
        "invalid",
        "P4-CB-025 semantic separation assertion",
      );
    },
  );
});

if (process.env.VERIFACTU_JAVA_MUTATION === "1") {
  test("P4-MUT-026 detects duplicate IDs in the signed XAdES target", async () => {
    await mutation(
      "P4-MUT-026",
      "P4-CB-026",
      "internal/xades-provider/dss/src/main/java/eu/noeos/verifactu/bridge/DssBridge.java",
      "if (e.hasAttribute(attr) && !ids.add(e.getAttribute(attr))) return false;",
      "if (false) return false;",
      async ({ jarPath }) => {
        const source = officialSignedVector();
        const text = new TextDecoder()
          .decode(source)
          .replace("<sum1:IDVersion>", '<sum1:IDVersion Id="duplicate">')
          .replace("<sum1:IDFactura>", '<sum1:IDFactura Id="duplicate">');
        const result = await verifyWithBridge(
          new TextEncoder().encode(text),
          jarPath,
        );
        assert.equal(
          result.profile,
          "invalid",
          "P4-CB-026 duplicate ID profile assertion",
        );
      },
    );
  });

  test("P4-MUT-027 detects extra references in the signed XAdES profile", async () => {
    await mutation(
      "P4-MUT-027",
      "P4-CB-027",
      "internal/xades-provider/dss/src/main/java/eu/noeos/verifactu/bridge/DssBridge.java",
      [
        {
          before: "signedInfoChildren.size() != 4",
          after: "signedInfoChildren.size() < 4",
        },
        { before: "refs.size() != 2", after: "refs.size() < 2" },
      ],
      undefined,
      async ({ jarPath }) => {
        const source = officialSignedVector();
        const text = new TextDecoder()
          .decode(source)
          .replace(
            "</ds:SignedInfo>",
            '<ds:Reference URI="https://example.invalid/attacker"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</ds:DigestValue></ds:Reference></ds:SignedInfo>',
          );
        const result = await verifyWithBridge(
          new TextEncoder().encode(text),
          jarPath,
        );
        assert.equal(
          result.profile,
          "invalid",
          "P4-CB-027 exact reference profile assertion",
        );
      },
    );
  });
}

test("P4-MUT-028 preserves separate chain and trust outcomes", async () => {
  await mutation(
    "P4-MUT-028",
    "P4-CB-028",
    "internal/xades-provider/pki.mjs",
    '    "trust",\n    "time",',
    '    "time",',
    async ({ load }) => {
      const { normalizeCertificateAssessment } = await load(
        "internal/xades-provider/pki.mjs",
      );
      const result = normalizeCertificateAssessment({
        chain: "valid",
        trust: "indeterminate",
        time: "valid",
        usage: "valid",
        identity: "valid",
        authorization: "indeterminate",
        algorithm: "valid",
      });
      assert.equal(
        result.outcomes.trust,
        "indeterminate",
        "P4-CB-028 separated trust outcome assertion",
      );
    },
  );
});

test("P4-MUT-037 rejects substitution of the permitted XAdES profile", async () => {
  await mutation(
    "P4-MUT-037",
    "P4-CB-037",
    "internal/xades-provider/provider.mjs",
    "if (\n    request.editionId !== XADES_EDITION_ID ||\n    request.profileId !== XADES_PROFILE_ID\n  )",
    "if (false)",
    async ({ load }) => {
      const { createXadesProvider } = await load(
        "internal/xades-provider/provider.mjs",
      );
      const result = await createXadesProvider({
        execute: async () => {
          throw new Error("must not execute");
        },
      }).verify({ ...xadesValid, profileId: "attacker-profile" });
      assert.equal(
        result.diagnostics[0],
        "DIAG-XADES-EDITION",
        "P4-CB-037 pinned profile assertion",
      );
    },
  );
});

test("P4-MUT-038 rejects signed bytes whose independent verification is invalid", async () => {
  await mutation(
    "P4-MUT-038",
    "P4-CB-038",
    "internal/xades-provider/provider.mjs",
    'if (\n    verification.profile !== "valid" ||\n    verification.cryptographic !== "valid"\n  )',
    "if (false)",
    async ({ load }) => {
      const { createXadesProvider } = await load(
        "internal/xades-provider/provider.mjs",
      );
      const execute = async (request) => {
        if (request.command === "SIGN_PREPARE")
          return {
            kind: "TBS",
            diagnostic: "NONE",
            payload: new Uint8Array(256),
          };
        if (request.command === "SIGN_COMPLETE")
          return {
            kind: "SIGNED",
            diagnostic: "NONE",
            payload: new TextEncoder().encode("<RegistroAlta/> "),
          };
        return {
          kind: "INDETERMINATE",
          diagnostic: "NONE",
          payload: new TextEncoder().encode(
            "VALID\tINVALID\tVALID\tUNKNOWN\tNONE\t0\t0",
          ),
        };
      };
      const provider = createXadesProvider({ execute });
      const result = await provider.sign({
        ...xadesValid,
        signer: {
          keyHandle: "test:opaque-key",
          certificateDer: new Uint8Array([3]),
          certificateChainDer: [],
          sign: async (data) => new Uint8Array(data.byteLength).fill(9),
        },
      });
      assert.equal(
        result.status,
        "invalid",
        "P4-CB-038 output signature verification assertion",
      );
    },
  );
});

test("P4-MUT-039 rejects revocation evidence outside its caller-time interval", async () => {
  await mutation(
    "P4-MUT-039",
    "P4-CB-039",
    "internal/xades-provider/pki.mjs",
    "thisUpdate > instant ||",
    "false ||",
    async ({ load }) => {
      const { normalizePkiObservation } = await load(
        "internal/xades-provider/pki.mjs",
      );
      const instant = Date.parse("2026-09-26T12:00:00Z");
      const result = normalizePkiObservation(
        {
          status: "valid",
          thisUpdateMs: instant + 1_000,
          nextUpdateMs: instant + 60_000,
        },
        {
          validationTimeMs: instant,
          maximumRevocationAgeSeconds: 3_600,
          crlEvidence: [new Uint8Array([1])],
          ocspEvidence: [],
        },
      );
      assert.equal(
        result.status,
        "stale",
        "P4-CB-039 caller-time evidence interval assertion",
      );
    },
  );
});

test("P4-MUT-029 keeps stale revocation evidence indeterminate", async () => {
  await mutation(
    "P4-MUT-029",
    "P4-CB-029",
    "internal/xades-provider/pki.mjs",
    'if (observation.status === "stale")\n    return Object.freeze({\n      status: "stale",\n      thisUpdateMs: observation.thisUpdateMs,\n      nextUpdateMs: observation.nextUpdateMs,\n    });',
    'if (observation.status === "stale")\n    return Object.freeze({\n      status: "valid",\n      thisUpdateMs: observation.thisUpdateMs,\n      nextUpdateMs: observation.nextUpdateMs,\n    });',
    async ({ load }) => {
      const { normalizePkiObservation } = await load(
        "internal/xades-provider/pki.mjs",
      );
      const result = normalizePkiObservation(
        { status: "stale", thisUpdateMs: 10, nextUpdateMs: 20 },
        {
          validationTimeMs: 15,
          maximumRevocationAgeSeconds: 60,
          crlEvidence: [new Uint8Array([1])],
          ocspEvidence: [],
        },
      );
      assert.equal(
        result.status,
        "stale",
        "P4-CB-029 stale evidence fail-closed assertion",
      );
    },
  );
});

test("P4-MUT-040 keeps unknown revocation evidence indeterminate", async () => {
  await mutation(
    "P4-MUT-040",
    "P4-CB-040",
    "internal/xades-provider/pki.mjs",
    'if (observation.status === "unknown")\n    return Object.freeze({\n      status: "unknown",\n      thisUpdateMs: null,\n      nextUpdateMs: null,\n    });',
    'if (observation.status === "unknown")\n    return Object.freeze({\n      status: "valid",\n      thisUpdateMs: null,\n      nextUpdateMs: null,\n    });',
    async ({ load }) => {
      const { normalizePkiObservation } = await load(
        "internal/xades-provider/pki.mjs",
      );
      const result = normalizePkiObservation(
        { status: "unknown" },
        {
          validationTimeMs: Date.parse("2026-09-26T12:00:00Z"),
          maximumRevocationAgeSeconds: 3_600,
          crlEvidence: [new Uint8Array([1])],
          ocspEvidence: [],
        },
      );
      assert.equal(
        result.status,
        "unknown",
        "P4-CB-040 unknown evidence fail-closed assertion",
      );
    },
  );
});

test("P4-MUT-041 prevents network-enabled Java policy in the DSS worker", async () => {
  await mutation(
    "P4-MUT-041",
    "P4-CB-041",
    "internal/xades-provider/worker.mjs",
    '"-Djava.security.manager=allow",',
    '"-Djava.security.manager=disallow",',
    async ({ load }) => {
      const { DSS_JVM_OPTIONS } = await load(
        "internal/xades-provider/worker.mjs",
      );
      assert.ok(
        DSS_JVM_OPTIONS.includes("-Djava.security.manager=allow"),
        "P4-CB-041 process network-deny assertion",
      );
    },
  );
});

test("P4-MUT-033 rejects artifacts whose order does not match the profile", async () => {
  await mutation(
    "P4-MUT-033",
    "P4-CB-033",
    "verification/engine-profile.js",
    "value.order === index",
    "true",
    async ({ load }) => {
      const { createEngineProfileProjection, ENGINE_PROFILE_TEST_VECTORS } =
        await load("verification/engine-profile.js");
      const { createVerificationClaimSet } = await load(
        "verification/claims.js",
      );
      const d = (c) => `sha256:${c.repeat(64)}`;
      const claims = createVerificationClaimSet([
        {
          kind: "official-format",
          status: "valid",
          evidenceDigest: d("a"),
          diagnostics: [],
        },
        {
          kind: "cryptographic",
          status: "indeterminate",
          diagnostics: ["DIAG-CRYPTO-UNKNOWN"],
        },
        {
          kind: "certificate-authorization",
          status: "indeterminate",
          diagnostics: ["DIAG-CERT-UNKNOWN"],
        },
        {
          kind: "aeat",
          status: "unsupported",
          diagnostics: ["DIAG-AEAT-UNSUPPORTED"],
        },
        {
          kind: "noeos-evidence",
          status: "indeterminate",
          diagnostics: ["DIAG-NOEOS-PENDING"],
        },
      ]).value;
      const vector = ENGINE_PROFILE_TEST_VECTORS[1].projection;
      assert.equal(
        createEngineProfileProjection({
          ...vector,
          artifacts: [...vector.artifacts].reverse(),
          claims,
        }).status,
        "invalid",
        "P4-CB-033 artifact order assertion",
      );
    },
  );
});

test("P4-MUT-034 rejects altered record evidence after independent verification", async () => {
  await mutation(
    "P4-MUT-034",
    "P4-CB-034",
    "verification/engine-adapter.js",
    [
      { before: 'verification.status !== "valid"', after: "false" },
      {
        before: "!validRecordEvidence(verification.evidence, projected.value)",
        after: "false",
      },
    ],
    undefined,
    async ({ load }) => {
      const { createVerificationClaimSet } = await load(
        "verification/claims.js",
      );
      const { createNoeosEngineEvidence, verifyNoeosEngineEvidence } =
        await load("verification/engine-adapter.js");
      const d = (c) => `sha256:${c.repeat(64)}`,
        o = (c) => `opaque:${c.repeat(64)}`;
      const claims = createVerificationClaimSet([
        {
          kind: "official-format",
          status: "valid",
          evidenceDigest: d("a"),
          diagnostics: [],
        },
        {
          kind: "cryptographic",
          status: "valid",
          evidenceDigest: d("b"),
          diagnostics: [],
        },
        {
          kind: "certificate-authorization",
          status: "indeterminate",
          diagnostics: ["DIAG-CERT-UNKNOWN"],
        },
        {
          kind: "aeat",
          status: "unsupported",
          diagnostics: ["DIAG-AEAT-UNSUPPORTED"],
        },
        {
          kind: "noeos-evidence",
          status: "indeterminate",
          diagnostics: ["DIAG-NOEOS-PENDING"],
        },
      ]).value;
      const input = {
        contextId: o("0"),
        sequenceId: o("1"),
        recordId: o("3"),
        editionId: "rrsif-2026-09-21-active",
        operationKind: "anulacion",
        artifacts: [{ order: 0, kind: "xml", digest: d("a") }],
        predecessorEvidenceDigest: d("d"),
        algorithmIds: ["sha-256"],
        claims,
        position: 1,
      };
      const created = createNoeosEngineEvidence(input);
      const altered = {
        ...created.value.recordEvidence,
        recordDigest: "0".repeat(64),
      };
      const result = verifyNoeosEngineEvidence(input, altered);
      assert.notEqual(
        result.value.status,
        "valid",
        "P4-CB-034 independent evidence verification assertion",
      );
    },
  );
});

test("P4-MUT-035 keeps an aborted Engine verification indeterminate", async () => {
  await mutation(
    "P4-MUT-035",
    "P4-CB-035",
    "verification/engine-adapter.js",
    'verification.status !== "valid"',
    "false",
    async ({ load }) => {
      const { createVerificationClaimSet } = await load(
        "verification/claims.js",
      );
      const { createNoeosEngineEvidence, verifyNoeosEngineEvidence } =
        await load("verification/engine-adapter.js");
      const { createEngine } = await import("@noeos/verification-engine");
      const d = (c) => `sha256:${c.repeat(64)}`,
        o = (c) => `opaque:${c.repeat(64)}`;
      const claims = createVerificationClaimSet([
        {
          kind: "official-format",
          status: "valid",
          evidenceDigest: d("a"),
          diagnostics: [],
        },
        {
          kind: "cryptographic",
          status: "valid",
          evidenceDigest: d("b"),
          diagnostics: [],
        },
        {
          kind: "certificate-authorization",
          status: "indeterminate",
          diagnostics: ["DIAG-CERT-UNKNOWN"],
        },
        {
          kind: "aeat",
          status: "unsupported",
          diagnostics: ["DIAG-AEAT-UNSUPPORTED"],
        },
        {
          kind: "noeos-evidence",
          status: "indeterminate",
          diagnostics: ["DIAG-NOEOS-PENDING"],
        },
      ]).value;
      const input = {
        contextId: o("0"),
        sequenceId: o("1"),
        recordId: o("3"),
        editionId: "rrsif-2026-09-21-active",
        operationKind: "anulacion",
        artifacts: [{ order: 0, kind: "xml", digest: d("a") }],
        predecessorEvidenceDigest: d("d"),
        algorithmIds: ["sha-256"],
        claims,
        position: 1,
      };
      const evidence = createNoeosEngineEvidence(input).value.recordEvidence;
      const port = {
        createEngine(options) {
          const engine = createEngine(options);
          return new Proxy(engine, {
            get(target, key, receiver) {
              if (key === "verifyRecord")
                return (request) => ({
                  ...Reflect.get(target, key, receiver).call(target, request),
                  status: "aborted",
                });
              return Reflect.get(target, key, receiver);
            },
          });
        },
      };
      const result = verifyNoeosEngineEvidence(input, evidence, port);
      assert.equal(
        result.value.status,
        "indeterminate",
        "P4-CB-035 abort remains indeterminate assertion",
      );
    },
  );
});

test("P4-MUT-036 redacts malformed profile identity data from diagnostics", async () => {
  await mutation(
    "P4-MUT-036",
    "P4-CB-036",
    "verification/engine-profile.js",
    'if (!isEngineProfileProjection(projection))\n            return invalid("DIAG-ENGINE-PROJECTION", "domain");\n        const artifacts',
    'if (!isEngineProfileProjection(projection))\n            return invalid(input.recordId, "domain");\n        const artifacts',
    async ({ load }) => {
      const { createVerificationClaimSet } = await load(
        "verification/claims.js",
      );
      const { createEngineProfileProjection, ENGINE_PROFILE_TEST_VECTORS } =
        await load("verification/engine-profile.js");
      const d = (c) => `sha256:${c.repeat(64)}`;
      const claims = createVerificationClaimSet([
        {
          kind: "official-format",
          status: "valid",
          evidenceDigest: d("a"),
          diagnostics: [],
        },
        {
          kind: "cryptographic",
          status: "indeterminate",
          diagnostics: ["DIAG-CRYPTO-UNKNOWN"],
        },
        {
          kind: "certificate-authorization",
          status: "indeterminate",
          diagnostics: ["DIAG-CERT-UNKNOWN"],
        },
        {
          kind: "aeat",
          status: "unsupported",
          diagnostics: ["DIAG-AEAT-UNSUPPORTED"],
        },
        {
          kind: "noeos-evidence",
          status: "indeterminate",
          diagnostics: ["DIAG-NOEOS-PENDING"],
        },
      ]).value;
      const vector = ENGINE_PROFILE_TEST_VECTORS[0].projection;
      const result = createEngineProfileProjection({
        ...vector,
        recordId: "ES12345678",
        claims,
      });
      assert.doesNotMatch(
        JSON.stringify(result),
        /ES12345678/u,
        "P4-CB-036 diagnostic redaction assertion",
      );
    },
  );
});

test("P4-MUT-032 kills a global valid flag on the claim set", async () => {
  await mutation(
    "P4-MUT-032",
    "P4-CB-032",
    "verification/claims.js",
    "return ok(Object.freeze({ claims }));",
    'return ok(Object.freeze({ claims, status: "valid" }));',
    async ({ load }) => {
      const { CLAIM_KINDS, createVerificationClaimSet } = await load(
        "verification/claims.js",
      );
      const statuses = ["valid", "invalid", "indeterminate", "unsupported"];
      const result = createVerificationClaimSet(
        CLAIM_KINDS.map((kind, index) => {
          const status = statuses[index];
          return {
            kind,
            status,
            ...(status === "valid"
              ? { evidenceDigest: `sha256:${"a".repeat(64)}` }
              : {}),
            diagnostics: status === "valid" ? [] : [`DIAG-${index}`],
          };
        }),
      );
      assert.equal(result.status, "ok", "P4-CB-032 creation assertion");
      assert.equal(
        Object.hasOwn(result.value, "status"),
        false,
        "P4-CB-032 no global status assertion",
      );
      assert.equal(
        Object.hasOwn(result.value, "valid"),
        false,
        "P4-CB-032 no global valid assertion",
      );
    },
  );
});
