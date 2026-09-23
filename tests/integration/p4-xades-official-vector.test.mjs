import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const { inspectXadesEnvelope } = await import(
  new URL("../../internal/xades-provider/provider.mjs", import.meta.url).href
);
const root = resolve(import.meta.dirname, "../..");
const archive = resolve(
  root,
  "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources/aeat/AnexosEjemplosFirmaRegFact.zip",
);
const c14n = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";

test("P4-D accepts the captured AEAT EPES signed RegistroAlta vector", () => {
  const xml = execFileSync("unzip", [
    "-p",
    archive,
    "ejemploRegistro-firmado-epes-xades4j.xml",
  ]);
  assert.deepEqual(
    inspectXadesEnvelope(
      {
        xml,
        targetType: "RegistroAlta",
        documentTransforms: [
          "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        ],
        signedPropertiesTransforms: [c14n],
        canonicalization: c14n,
        policyIdentifier: "urn:oid:2.16.724.1.3.1.1.2.1.9",
      },
      { pythonExecutable: process.env.VERIFACTU_PYTHON },
    ),
    { kind: "valid", diagnostics: [] },
  );
});
