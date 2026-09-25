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
});

test("provider rejects a foreign edition, malformed request, and pre-aborted operation", async () => {
  let calls = 0;
  const provider = createXmlXsdProvider({
    execute: async () => {
      calls += 1;
      return { kind: "valid", diagnostics: [] };
    },
  });
  const foreign = await provider.validate(request({ editionId: "other-edition" }));
  assert.equal(foreign.status, "unavailable");
  assert.equal(foreign.diagnostics[0], "DIAG-XML-EDITION");
  assert.equal((await provider.validate(null)).status, "defect");
  const controller = new AbortController();
  controller.abort();
  const cancelled = await provider.validate(request(), { signal: controller.signal });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.diagnostics[0], "DIAG-XML-CANCELLED");
  assert.equal(calls, 0);
});

test("worker bridge accepts only bounded structured diagnostics", async () => {
  const provider = createXmlXsdProvider({
    execute: async () => ({ kind: "invalid", diagnostics: ["DIAG-XSD-INVALID"] }),
  });
  const result = await provider.validate(request());
  assert.equal(result.status, "invalid");
  assert.equal(result.xsd, "invalid");

  const malformed = createXmlXsdProvider({
    execute: async () => ({ kind: "invalid", diagnostics: ["taxpayer-secret"] }),
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
  const unknownBudget = await provider.validate(request(), {
    limits: { maxBytes: 1 },
  });
  assert.equal(unknownBudget.status, "limit");
  assert.equal(unknownBudget.diagnostics[0], "DIAG-XML-LIMITS");
  assert.equal(calls, 0);
});
