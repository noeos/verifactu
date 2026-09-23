import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadXmlProvider } from "../support/p4c-xml.mjs";

const { validateXmlXsd } = await loadXmlProvider();
const encode = (value) => new TextEncoder().encode(value);
const schemaBytes = encode(
  '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="root" type="xs:string"/></xs:schema>',
);
const schema = {
  id: "memory:///root.xsd",
  bytes: schemaBytes,
  sha256: createHash("sha256").update(schemaBytes).digest("hex"),
};
const request = (xml, schemas = [schema]) => ({
  xml: encode(xml),
  rootSchemaId: schemas[0].id,
  schemas,
  semanticStatus: "not-evaluated",
});

test("DTD and entity payloads are denied before the parser", () => {
  for (const xml of [
    '<!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>',
    '<!ENTITY x "boom"><root/>',
  ]) {
    const result = validateXmlXsd(request(xml), {
      worker: () => assert.fail("worker must not run"),
    });
    assert.equal(result.status, "invalid");
    assert.deepEqual(result.diagnostics, ["DIAG-XML-FORBIDDEN-MARKUP"]);
  }
});

test("XInclude payloads are denied before resolution", () => {
  const result = validateXmlXsd(
    request(
      '<root xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include href="file:///etc/passwd" parse="text"/></root>',
    ),
    { worker: () => assert.fail("worker must not run") },
  );
  assert.equal(result.status, "invalid");
});

test("schema DTDs are denied except the exact pinned XMLDSIG resource", () => {
  const maliciousBytes = encode(
    '<!DOCTYPE xs:schema [<!ENTITY x SYSTEM "file:///etc/passwd">]><xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>',
  );
  const malicious = {
    id: "memory:///evil.xsd",
    bytes: maliciousBytes,
    sha256: createHash("sha256").update(maliciousBytes).digest("hex"),
  };
  const result = validateXmlXsd(request("<root/>", [malicious]), {
    worker: () => assert.fail("worker must not run"),
  });
  assert.equal(result.status, "defect");
  assert.deepEqual(result.diagnostics, ["DIAG-XSD-FORBIDDEN-MARKUP"]);
});

test("unknown network and file schema resolution fails closed", () => {
  const externalBytes = encode(
    '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:include schemaLocation="https://attacker.invalid/evil.xsd"/><xs:element name="root" type="xs:string"/></xs:schema>',
  );
  const external = {
    id: "memory:///external.xsd",
    bytes: externalBytes,
    sha256: createHash("sha256").update(externalBytes).digest("hex"),
  };
  const result = validateXmlXsd(request("<root/>", [external]), {
    pythonExecutable: process.env.VERIFACTU_PYTHON,
  });
  assert.equal(result.status, "defect");
  assert.equal(result.xsd, "not-evaluated");
});
