import assert from "node:assert/strict";
import test from "node:test";
import { loadXmlWorker } from "../support/p4c-xml.mjs";

const { runXmlWorkerBatch } = await loadXmlWorker();

test("P4-FUZZ-003 offline XSD worker validates 4096 bounded instances", () => {
  const schemaText =
    '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="root" type="xs:string"/></xs:schema>';
  let state = 0x9e3779b9;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state;
  };
  const instances = [];
  for (let index = 0; index < 4096; index += 1) {
    const value =
      index % 2 === 0 ? `<root>${next()}</root>` : `<other>${next()}</other>`;
    instances.push(Buffer.from(value).toString("base64"));
  }
  const result = runXmlWorkerBatch(
    {
      rootSchemaId: "memory:///root.xsd",
      schemas: [{ aliases: ["memory:///root.xsd"], base64: Buffer.from(schemaText).toString("base64") }],
      xmlBatchBase64: instances,
    },
    { maximumOutputBytes: 1_048_576, pythonExecutable: process.env.VERIFACTU_PYTHON, timeoutMs: 5_000 },
  );
  assert.equal(result.kind, "batch");
  assert.equal(result.results.length, 4096);
  assert.equal(result.results.every((entry, index) => index % 2 === 0 ? entry.kind === "valid" : entry.kind === "invalid"), true);
});
