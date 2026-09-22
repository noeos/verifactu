import assert from "node:assert/strict";
import test from "node:test";
import {
  loadXmlProvider,
  officialPositiveXml,
  officialSchemaClosure,
} from "../support/p4c-xml.mjs";

const { validateXmlXsd } = await loadXmlProvider();

async function request(xml, semanticStatus = "not-evaluated") {
  return {
    xml: xml ?? (await officialPositiveXml()),
    rootSchemaId: "SuministroLR.xsd",
    schemas: await officialSchemaClosure(),
    semanticStatus,
  };
}

test("pinned AEAT SuministroLR positive vector validates fully offline", async () => {
  const result = validateXmlXsd(await request(), {
    pythonExecutable: process.env.VERIFACTU_PYTHON,
  });
  assert.deepEqual(result, {
    status: "valid",
    xsd: "valid",
    semantic: "not-evaluated",
    diagnostics: [],
  });
});

test("minimal official mutation is rejected by XSD", async () => {
  const xml = new TextDecoder()
    .decode(await officialPositiveXml())
    .replace("<sf:TipoFactura>F1</sf:TipoFactura>", "<sf:TipoFactura>XX</sf:TipoFactura>");
  const result = validateXmlXsd(await request(new TextEncoder().encode(xml)), {
    pythonExecutable: process.env.VERIFACTU_PYTHON,
  });
  assert.equal(result.status, "invalid");
  assert.equal(result.xsd, "invalid");
  assert.equal(result.semantic, "not-evaluated");
});

test("XSD validity cannot upgrade an independent semantic result", async () => {
  const result = validateXmlXsd(await request(await officialPositiveXml(), "invalid"), {
    pythonExecutable: process.env.VERIFACTU_PYTHON,
  });
  assert.equal(result.status, "valid");
  assert.equal(result.xsd, "valid");
  assert.equal(result.semantic, "invalid");
});

test("provider faults fail closed and never claim XSD validity", async () => {
  const result = validateXmlXsd(await request(), {
    worker: () => ({ kind: "defect", diagnostics: ["DIAG-XSD-PROVIDER"] }),
  });
  assert.deepEqual(result, {
    status: "defect",
    xsd: "not-evaluated",
    semantic: "not-evaluated",
    diagnostics: ["DIAG-XSD-PROVIDER"],
  });
});
