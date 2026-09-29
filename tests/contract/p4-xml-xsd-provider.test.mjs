import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createXmlXsdProvider,
  PINNED_SCHEMAS,
  XML_EDITION_ID,
} from "../../internal/xml-provider/provider.mjs";

const sourceRoot =
  "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources";
const paths = {
  "xsd-suministro-informacion": "aeat/SuministroInformacion.xsd",
  "xmldsig-schema": "standards/xmldsig-core-schema.xsd",
};
const request = (overrides = {}) => ({
  editionId: XML_EDITION_ID,
  xml: Buffer.from("<RegistroAlta/>", "utf8"),
  rootSchemaId: "xsd-suministro-informacion",
  schemas: Object.entries(paths).map(([id, path]) => ({
    id,
    bytes: readFileSync(`${sourceRoot}/${path}`),
    sha256: PINNED_SCHEMAS[id].sha256,
  })),
  semanticStatus: "not-evaluated",
  ...overrides,
});

test("provider accepts only the exact edition schema closure and digest pins", async () => {
  let calls = 0;
  const provider = createXmlXsdProvider({
    execute: async () => {
      calls += 1;
      return { kind: "valid", diagnostics: [] };
    },
  });
  const good = await provider.validate(request());
  assert.equal(good.status, "valid");
  assert.equal(calls, 1);

  const unknownRoot = await provider.validate(
    request({ rootSchemaId: "unlisted-root" }),
  );
  assert.equal(unknownRoot.status, "defect");
  assert.equal(unknownRoot.diagnostics[0], "DIAG-XSD-RESOURCE-MAP");

  const extra = request({
    schemas: [
      ...request().schemas,
      { id: "unlisted", bytes: Buffer.from("x"), sha256: "0".repeat(64) },
    ],
  });
  const rejected = await provider.validate(extra);
  assert.equal(rejected.status, "defect");
  assert.equal(rejected.diagnostics[0], "DIAG-XSD-RESOURCE-MAP");
  assert.equal(calls, 1);

  const changed = request();
  changed.schemas[0].bytes[0] ^= 1;
  const digestMismatch = await provider.validate(changed);
  assert.equal(digestMismatch.status, "defect");
  assert.equal(digestMismatch.diagnostics[0], "DIAG-XSD-RESOURCE-MAP");
  assert.equal(calls, 1);

  const wrongPin = request();
  wrongPin.schemas[0].sha256 = "0".repeat(64);
  const pinMismatch = await provider.validate(wrongPin);
  assert.equal(pinMismatch.status, "defect");
  assert.equal(pinMismatch.diagnostics[0], "DIAG-XSD-RESOURCE-MAP");
  assert.equal(calls, 1);
});

test("provider rejects a foreign edition, malformed request, and pre-aborted operation", async () => {
  let calls = 0;
  const provider = createXmlXsdProvider({
    execute: async () => {
      calls += 1;
      return { kind: "valid", diagnostics: [] };
    },
  });
  const foreign = await provider.validate(
    request({ editionId: "other-edition" }),
  );
  assert.equal(foreign.status, "unavailable");
  assert.equal(foreign.diagnostics[0], "DIAG-XML-EDITION");
  assert.equal((await provider.validate(null)).status, "defect");
  const controller = new AbortController();
  controller.abort();
  const cancelled = await provider.validate(request(), {
    signal: controller.signal,
  });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.diagnostics[0], "DIAG-XML-CANCELLED");
  assert.equal(calls, 0);
});

test("worker bridge accepts only bounded structured diagnostics", async () => {
  const provider = createXmlXsdProvider({
    execute: async () => ({
      kind: "invalid",
      diagnostics: ["DIAG-XSD-INVALID"],
    }),
  });
  const result = await provider.validate(request());
  assert.equal(result.status, "invalid");
  assert.equal(result.xsd, "invalid");

  const malformed = createXmlXsdProvider({
    execute: async () => ({
      kind: "invalid",
      diagnostics: ["taxpayer-secret"],
    }),
  });
  const safe = await malformed.validate(request());
  assert.equal(safe.status, "defect");
  assert.deepEqual(safe.diagnostics, ["DIAG-XSD-PROVIDER"]);
  assert.doesNotMatch(JSON.stringify(safe), /taxpayer-secret/u);
});

test("schema resource and input byte ceilings fail before process creation", async () => {
  let calls = 0;
  const provider = createXmlXsdProvider({
    execute: async () => {
      calls += 1;
      return { kind: "valid", diagnostics: [] };
    },
  });
  const oversizeXml = await provider.validate(
    request({ xml: Buffer.alloc(4_194_305) }),
  );
  assert.equal(oversizeXml.status, "limit");
  assert.equal(oversizeXml.diagnostics[0], "DIAG-XML-BYTES");
  const lowBudget = await provider.validate(request(), {
    limits: { maximumSchemaBytes: 1 },
  });
  assert.equal(lowBudget.status, "limit");
  assert.equal(lowBudget.diagnostics[0], "DIAG-XSD-RESOURCES");
  const validRequest = request();
  const schemaSizes = validRequest.schemas.map(
    (schema) => schema.bytes.byteLength,
  );
  const schemaTotal = schemaSizes.reduce((total, size) => total + size, 0);
  const exactXmlLimit = await provider.validate(validRequest, {
    limits: { maximumXmlBytes: validRequest.xml.byteLength },
  });
  assert.equal(exactXmlLimit.status, "valid");
  const exactSchemaCount = await provider.validate(validRequest, {
    limits: { maximumSchemas: validRequest.schemas.length },
  });
  assert.equal(exactSchemaCount.status, "valid");
  const exactSchemaByteLimit = await provider.validate(validRequest, {
    limits: { maximumSchemaBytes: schemaTotal },
  });
  assert.equal(exactSchemaByteLimit.status, "valid");
  const fractionalSchemaLimit = await provider.validate(validRequest, {
    limits: { maximumSchemaBytes: schemaTotal + 0.5 },
  });
  assert.equal(fractionalSchemaLimit.diagnostics[0], "DIAG-XML-LIMITS");
  const zeroSchemaLimit = await provider.validate(validRequest, {
    limits: { maximumSchemaBytes: 0 },
  });
  assert.equal(zeroSchemaLimit.diagnostics[0], "DIAG-XML-LIMITS");
  const aggregateSchemaLimit = await provider.validate(validRequest, {
    limits: { maximumSchemaBytes: Math.max(...schemaSizes) },
  });
  assert.equal(aggregateSchemaLimit.diagnostics[0], "DIAG-XSD-RESOURCES");
  const unknownBudget = await provider.validate(request(), {
    limits: { maxBytes: 1 },
  });
  assert.equal(unknownBudget.status, "limit");
  assert.equal(unknownBudget.diagnostics[0], "DIAG-XML-LIMITS");
  assert.equal(calls, 3);
});

test("worker statuses, exceptions, and diagnostic bounds map to stable outcomes", async () => {
  for (const [kind, status] of [
    ["limit", "limit"],
    ["cancelled", "cancelled"],
    ["unavailable", "unavailable"],
    ["defect", "defect"],
  ]) {
    const provider = createXmlXsdProvider({
      execute: async () => ({ kind, diagnostics: ["DIAG-XSD-CASE"] }),
    });
    const result = await provider.validate(request());
    assert.equal(result.status, status);
    assert.equal(
      result.diagnostics[0],
      kind === "cancelled" ? "DIAG-XML-CANCELLED" : "DIAG-XSD-CASE",
    );
  }

  const throwing = createXmlXsdProvider({
    execute: async () => {
      throw new Error("private detail");
    },
  });
  assert.deepEqual((await throwing.validate(request())).diagnostics, [
    "DIAG-XSD-PROVIDER",
  ]);
  const exactDiagnosticBoundary = createXmlXsdProvider({
    execute: async () => ({
      kind: "valid",
      diagnostics: Array.from({ length: 8 }, () => `DIAG-${"A".repeat(75)}`),
    }),
  });
  assert.equal(
    (await exactDiagnosticBoundary.validate(request())).status,
    "valid",
  );
  for (const diagnostics of [
    Array.from({ length: 9 }, () => "DIAG-XSD-TOO-MANY"),
    ["DIAG-XSD-" + "A".repeat(80)],
    [1],
  ]) {
    const malformed = createXmlXsdProvider({
      execute: async () => ({ kind: "valid", diagnostics }),
    });
    assert.equal((await malformed.validate(request())).status, "defect");
  }
});

test("request and limit normalization reject malformed values before worker execution", async () => {
  let calls = 0;
  const provider = createXmlXsdProvider({
    execute: async () => {
      calls += 1;
      return { kind: "valid", diagnostics: [] };
    },
  });
  for (const malformed of [
    { xml: "not bytes" },
    { rootSchemaId: 4 },
    { schemas: {} },
    { schemas: [null] },
  ]) {
    assert.equal(
      (await provider.validate(request(malformed))).status,
      "defect",
    );
  }
  assert.equal(
    (await provider.validate(request(), { deadlineMs: 0 })).diagnostics[0],
    "DIAG-XML-DEADLINE",
  );
  assert.equal(
    (await provider.validate(request(), { limits: null })).status,
    "valid",
  );
  assert.equal(
    (await provider.validate(request(), { limits: [] })).diagnostics[0],
    "DIAG-XML-LIMITS",
  );
  assert.equal(calls, 1);
});
