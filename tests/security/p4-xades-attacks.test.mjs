import assert from "node:assert/strict";
import test from "node:test";

const { inspectXadesEnvelope } = await import(
  new URL("../../internal/xades-provider/provider.mjs", import.meta.url).href
);
const encode = (value) => new TextEncoder().encode(value);
const transform = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";
const request = (xml) => ({
  xml: encode(xml),
  targetId: "record-1",
  targetType: "RegistroAlta",
  transforms: [transform],
});
const valid = `<RegistroAlta Id="record-1"><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:SignedInfo><ds:Reference URI="#record-1"><ds:Transforms><ds:Transform Algorithm="${transform}"/></ds:Transforms></ds:Reference></ds:SignedInfo></ds:Signature></RegistroAlta>`;
const options = { pythonExecutable: process.env.VERIFACTU_PYTHON };

test("P4-D accepts one local enveloped reference to the expected unique target", () => {
  assert.deepEqual(inspectXadesEnvelope(request(valid), options), {
    kind: "valid",
    diagnostics: [],
  });
});

test("P4-D rejects signature-wrapping, external references and transform drift", () => {
  for (const [xml, diagnostic] of [
    [
      valid.replace(
        "</RegistroAlta>",
        '<RegistroAlta Id="record-1"/></RegistroAlta>',
      ),
      "DIAG-XADES-UNIQUE-ID",
    ],
    [
      valid.replace('URI="#record-1"', 'URI="https://attacker.invalid/x"'),
      "DIAG-XADES-REFERENCE",
    ],
    [
      valid.replace(transform, "http://www.w3.org/TR/1999/REC-xslt-19991116"),
      "DIAG-XADES-TRANSFORM",
    ],
    [
      valid
        .replace("<RegistroAlta Id", "<Other Id")
        .replace("</RegistroAlta>", "</Other>"),
      "DIAG-XADES-TARGET",
    ],
    [
      valid
        .replace("<ds:Reference", "<ds:Reference")
        .replace(
          "</ds:Reference>",
          '</ds:Reference><ds:Reference URI="#record-1"/>',
        ),
      "DIAG-XADES-REFERENCE",
    ],
  ])
    assert.deepEqual(inspectXadesEnvelope(request(xml), options), {
      kind: "invalid",
      diagnostics: [diagnostic],
    });
});

test("P4-D rejects hostile XML and absent isolated engines fail closed", () => {
  assert.deepEqual(
    inspectXadesEnvelope(request("<!DOCTYPE a><RegistroAlta/>"), options),
    { kind: "invalid", diagnostics: ["DIAG-XADES-MARKUP"] },
  );
  assert.deepEqual(
    inspectXadesEnvelope(request(valid), {
      pythonExecutable: "/absent/python",
    }),
    { kind: "unavailable", diagnostics: ["DIAG-XADES-UNAVAILABLE"] },
  );
});
