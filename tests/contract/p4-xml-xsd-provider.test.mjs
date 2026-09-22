import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadXmlProvider, loadXmlWorker } from "../support/p4c-xml.mjs";

const { TEST_ONLY_XML_PROVIDER, validateXmlXsd } = await loadXmlProvider();
const { interpretXmlWorkerExecution, normalizeXmlWorkerOptions } =
  await loadXmlWorker();
const bytes = (text) => new TextEncoder().encode(text);
const schema = (id, text, aliases = []) => {
  const value = bytes(text);
  return {
    id,
    aliases,
    bytes: value,
    sha256: createHash("sha256").update(value).digest("hex"),
  };
};
const root = schema(
  "memory:///root.xsd",
  '<?xml version="1.0"?><xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:test" xmlns:t="urn:test" elementFormDefault="qualified"><xs:simpleType name="Value"><xs:restriction base="xs:string"><xs:enumeration value="ok"/></xs:restriction></xs:simpleType><xs:element name="root" type="t:Value"/></xs:schema>',
);

const request = (xml = '<root xmlns="urn:test">ok</root>') => ({
  xml: bytes(xml),
  rootSchemaId: root.id,
  schemas: [root],
  semanticStatus: "not-evaluated",
});

test("provider validates a complete in-memory root schema", () => {
  const result = validateXmlXsd(request(), {
    pythonExecutable: process.env.VERIFACTU_PYTHON,
  });
  assert.deepEqual(result, {
    status: "valid",
    xsd: "valid",
    semantic: "not-evaluated",
    diagnostics: [],
  });
});

test("provider reports XSD-invalid separately from provider defects", () => {
  const invalid = validateXmlXsd(request('<root xmlns="urn:test">no</root>'), {
    pythonExecutable: process.env.VERIFACTU_PYTHON,
  });
  assert.equal(invalid.status, "invalid");
  assert.equal(invalid.xsd, "invalid");
  assert.deepEqual(invalid.diagnostics, ["DIAG-XSD-INVALID"]);

  const malformed = validateXmlXsd(request("<root>"), {
    pythonExecutable: process.env.VERIFACTU_PYTHON,
  });
  assert.equal(malformed.status, "invalid");
  assert.deepEqual(malformed.diagnostics, ["DIAG-XML-SYNTAX"]);
});

test("provider reports an absent engine as unavailable", () => {
  const result = validateXmlXsd(request(), {
    pythonExecutable: "/definitely-absent/verifactu-python",
  });
  assert.equal(result.status, "unavailable");
  assert.equal(result.xsd, "not-evaluated");
  assert.deepEqual(result.diagnostics, ["DIAG-XSD-UNAVAILABLE"]);
});

test("provider verifies schema digests and root closure", () => {
  const digestMismatch = request();
  digestMismatch.schemas = [{ ...root, sha256: "0".repeat(64) }];
  assert.deepEqual(validateXmlXsd(digestMismatch).diagnostics, [
    "DIAG-XSD-DIGEST",
  ]);

  const missing = { ...request(), rootSchemaId: "memory:///missing.xsd" };
  assert.deepEqual(validateXmlXsd(missing).diagnostics, ["DIAG-XSD-ROOT"]);
});

test("provider rejects malformed requests and duplicate aliases", () => {
  assert.deepEqual(validateXmlXsd({}), {
    status: "defect",
    xsd: "not-evaluated",
    semantic: "not-evaluated",
    diagnostics: ["DIAG-XSD-REQUEST"],
  });
  const duplicate = request();
  duplicate.schemas = [
    root,
    { ...root, id: "memory:///other.xsd", aliases: [root.id] },
  ];
  assert.deepEqual(validateXmlXsd(duplicate).diagnostics, [
    "DIAG-XSD-RESOURCE-MAP",
  ]);
});

test("closed request grammar rejects every required member and schema member", () => {
  const malformed = [
    null,
    { ...request(), xml: "not-bytes" },
    { ...request(), rootSchemaId: 1 },
    { ...request(), schemas: {} },
    { ...request(), semanticStatus: "unknown" },
    { ...request(), schemas: [null] },
    { ...request(), schemas: [{ ...root, id: 1 }] },
    { ...request(), schemas: [{ ...root, bytes: [] }] },
    { ...request(), schemas: [{ ...root, sha256: "F".repeat(64) }] },
    { ...request(), schemas: [{ ...root, aliases: "not-an-array" }] },
    { ...request(), schemas: [{ ...root, aliases: [1] }] },
  ];
  for (const candidate of malformed) {
    const result = validateXmlXsd(candidate, {
      worker: () => assert.fail("malformed input reached worker"),
    });
    assert.equal(result.status, "defect");
    assert.deepEqual(result.diagnostics, ["DIAG-XSD-REQUEST"]);
  }
});

test("request and resolver-map boundaries are exact", () => {
  const accepted = validateXmlXsd(request(), {
    deadlineMs: 1,
    worker: () => ({ kind: "valid", diagnostics: [] }),
  });
  assert.equal(accepted.status, "valid");
  for (const deadlineMs of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const result = validateXmlXsd(request(), { deadlineMs });
    assert.deepEqual(result.diagnostics, ["DIAG-XML-DEADLINE"]);
  }
  for (const aliases of [[""], ["file:///outside.xsd"]]) {
    const result = validateXmlXsd(
      { ...request(), schemas: [{ ...root, aliases }] },
      { worker: () => assert.fail("bad alias reached worker") },
    );
    assert.deepEqual(result.diagnostics, ["DIAG-XSD-RESOURCE-MAP"]);
  }
});

test("internal provider predicates have explicit boundary oracles", () => {
  assert.equal(TEST_ONLY_XML_PROVIDER.findTagEnd('<a x=">">', 1), 8);
  assert.equal(TEST_ONLY_XML_PROVIDER.findTagEnd('<a x="unterminated', 1), -1);
  assert.equal(TEST_ONLY_XML_PROVIDER.findTagEnd("<a x='>'/>", 1), 9);
  assert.equal(TEST_ONLY_XML_PROVIDER.strictUtf8(bytes("é")), "é");
  assert.throws(() =>
    TEST_ONLY_XML_PROVIDER.strictUtf8(Uint8Array.from([0xff])),
  );
  assert.deepEqual(TEST_ONLY_XML_PROVIDER.normalizeLimits(), {
    maximumXmlBytes: 4_194_304,
    maximumSchemaBytes: 8_388_608,
    maximumSchemas: 32,
    maximumDepth: 64,
    maximumNodes: 100_000,
    maximumAttributes: 4_096,
    maximumNamespaces: 256,
    maximumTextBytes: 2_097_152,
    maximumOutputBytes: 65_536,
    deadlineMs: 5_000,
    maximumCpuSeconds: 5,
  });
  for (const invalid of [{ maximumNodes: 0 }, { maximumDepth: 1.5 }])
    assert.throws(() => TEST_ONLY_XML_PROVIDER.normalizeLimits(invalid));
  assert.equal(TEST_ONLY_XML_PROVIDER.validRequest(request()), true);
  assert.equal(TEST_ONLY_XML_PROVIDER.validRequest(null), false);
  assert.equal(TEST_ONLY_XML_PROVIDER.validRequest({}), false);
  const dsigDtd = '<!DOCTYPE schema [<!ENTITY dsig "http://www.w3.org/2000/09/xmldsig#">]><schema/>';
  assert.equal(
    TEST_ONLY_XML_PROVIDER.normalizeSchemaText("memory:///plain.xsd", "0".repeat(64), dsigDtd),
    dsigDtd,
  );
  assert.equal(
    TEST_ONLY_XML_PROVIDER.normalizeSchemaText(
      "http://www.w3.org/TR/xmldsig-core/xmldsig-core-schema.xsd",
      "d102ad3df7664c307e0c2c776ba4a90513b1969974d8a940bae1a77f9f21e15d",
      dsigDtd,
    ),
    "<schema/>",
  );
  assert.throws(() =>
    TEST_ONLY_XML_PROVIDER.normalizeSchemaText(
      "http://www.w3.org/TR/xmldsig-core/xmldsig-core-schema.xsd",
      "d102ad3df7664c307e0c2c776ba4a90513b1969974d8a940bae1a77f9f21e15d",
      "<schema/>",
    ),
  );
});

test("every worker outcome has a stable fail-closed provider mapping", () => {
  const cases = [
    ["valid", "valid", "valid", []],
    ["invalid", "invalid", "invalid", ["DIAG-XSD-INVALID"]],
    ["limit", "limit", "not-evaluated", ["DIAG-XML-DEADLINE"]],
    ["unavailable", "unavailable", "not-evaluated", ["DIAG-XSD-UNAVAILABLE"]],
    ["defect", "defect", "not-evaluated", ["DIAG-XSD-PROVIDER"]],
  ];
  for (const [kind, status, xsd, diagnostics] of cases) {
    const result = validateXmlXsd(request(), {
      worker: () => ({ kind, diagnostics }),
    });
    assert.deepEqual(result, {
      status,
      xsd,
      semantic: "not-evaluated",
      diagnostics,
    });
  }
});

test("cancellation is rechecked after the synchronous isolated worker returns", () => {
  const controller = new AbortController();
  const result = validateXmlXsd(request(), {
    signal: controller.signal,
    worker: () => {
      controller.abort();
      return { kind: "valid", diagnostics: [] };
    },
  });
  assert.deepEqual(result, {
    status: "cancelled",
    xsd: "not-evaluated",
    semantic: "not-evaluated",
    diagnostics: ["DIAG-XML-CANCELLED"],
  });
});

test("worker execution results are mapped fail-closed before crossing the boundary", () => {
  const execution = (overrides = {}) => ({ status: 0, stdout: "", ...overrides });
  assert.deepEqual(interpretXmlWorkerExecution(execution({ error: { code: "ETIMEDOUT" } }), false), { kind: "limit", diagnostics: ["DIAG-XML-DEADLINE"] });
  assert.deepEqual(interpretXmlWorkerExecution(execution({ signal: "SIGXCPU" }), false), { kind: "limit", diagnostics: ["DIAG-XML-CPU"] });
  assert.deepEqual(interpretXmlWorkerExecution(execution({ error: { code: "ENOENT" } }), false), { kind: "unavailable", diagnostics: ["DIAG-XSD-UNAVAILABLE"] });
  for (const result of [
    execution({
      error: new Error("spawn"),
      stdout: JSON.stringify({ kind: "valid", diagnostics: [], externalAttempts: 0 }),
    }),
    execution({ status: 1 }),
    execution({ stdout: "not-json" }),
    execution({ stdout: JSON.stringify({ kind: "valid", diagnostics: [], externalAttempts: -1 }) }),
    execution({ stdout: JSON.stringify({ kind: "valid", diagnostics: [], externalAttempts: 1 }) }),
    execution({ stdout: JSON.stringify({ kind: "unknown", diagnostics: [], externalAttempts: 0 }) }),
    execution({ stdout: JSON.stringify({ kind: "valid", diagnostics: "not-an-array", externalAttempts: 0 }) }),
    execution({ stdout: JSON.stringify({ kind: "valid", diagnostics: [1], externalAttempts: 0 }) }),
    execution({ stdout: JSON.stringify({ kind: "valid", diagnostics: [], externalAttempts: "0" }) }),
  ]) assert.deepEqual(interpretXmlWorkerExecution(result, false), { kind: "defect", diagnostics: result.stdout.includes('"externalAttempts":1') ? ["DIAG-XSD-CLOSED-RESOLVER"] : ["DIAG-XSD-PROVIDER"] });
  assert.deepEqual(interpretXmlWorkerExecution(execution({ stdout: JSON.stringify({ kind: "valid", diagnostics: ["ok"], externalAttempts: 0 }) }), false), { kind: "valid", diagnostics: ["ok"] });
  assert.deepEqual(interpretXmlWorkerExecution(execution({ stdout: JSON.stringify({ kind: "batch", results: [{ kind: "valid", diagnostics: [] }, { kind: "invalid", diagnostics: ["DIAG-XSD-INVALID"] }], externalAttempts: 0 }) }), true), { kind: "batch", results: [{ kind: "valid", diagnostics: [] }, { kind: "invalid", diagnostics: ["DIAG-XSD-INVALID"] }] });
  for (const response of [
    { kind: "valid", diagnostics: [], externalAttempts: 0 },
    { kind: "batch", results: "not-an-array", externalAttempts: 0 },
    { kind: "batch", results: [{ kind: "unknown", diagnostics: [] }], externalAttempts: 0 },
    { kind: "valid", results: [], externalAttempts: 0 },
  ])
    assert.deepEqual(
      interpretXmlWorkerExecution(execution({ stdout: JSON.stringify(response) }), true),
      { kind: "defect", diagnostics: ["DIAG-XSD-PROVIDER"] },
    );
});

test("worker option defaults and explicit zero-like values are deterministic", () => {
  const defaults = normalizeXmlWorkerOptions();
  assert.equal(defaults.pythonExecutable, process.env.VERIFACTU_PYTHON ?? "python3");
  assert.equal(defaults.timeoutMs, 5_000);
  assert.equal(defaults.maximumOutputBytes, 65_536);
  assert.deepEqual(normalizeXmlWorkerOptions({
    pythonExecutable: "python-isolated",
    timeoutMs: 1,
    maximumOutputBytes: 1,
  }), {
    pythonExecutable: "python-isolated",
    timeoutMs: 1,
    maximumOutputBytes: 1,
  });
  assert.deepEqual(normalizeXmlWorkerOptions({
    pythonExecutable: "",
    timeoutMs: 0,
    maximumOutputBytes: 0,
  }), {
    pythonExecutable: "",
    timeoutMs: 0,
    maximumOutputBytes: 0,
  });
});
