import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { once } from "node:events";
import test from "node:test";
import {
  createXmlXsdProvider,
  PINNED_SCHEMAS,
  XML_EDITION_ID,
} from "../../internal/xml-provider/provider.mjs";

const sourceRoot =
  "editions/source-snapshots/rrsif-2026-09-21-authoritative/sources";
const schemaPaths = {
  "xsd-suministro-informacion": "aeat/SuministroInformacion.xsd",
  "xmldsig-schema": "standards/xmldsig-core-schema.xsd",
};
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
    assert.doesNotMatch(JSON.stringify(results), /root:|network-accessed|\/etc\/passwd/u);
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
  const tooLarge = await provider.validate(fixture(`<r>${"x".repeat(4_194_304)}</r>`));
  assert.equal(tooLarge.status, "limit");
  assert.equal(tooLarge.diagnostics[0], "DIAG-XML-BYTES");

  const deadline = await provider.validate(fixture("<r/>"), { deadlineMs: 1 });
  assert.equal(deadline.status, "limit");
  assert.equal(deadline.diagnostics[0], "DIAG-XML-DEADLINE");

  const controller = new AbortController();
  const validating = provider.validate(fixture(`<r>${"x".repeat(1_000_000)}</r>`), {
    signal: controller.signal,
  });
  setTimeout(() => controller.abort(), 1).unref?.();
  const cancelled = await validating;
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.diagnostics[0], "DIAG-XML-CANCELLED");

  const unavailable = await createXmlXsdProvider({ pythonExecutable: "/missing/python" }).validate(
    fixture("<r/>"),
  );
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.diagnostics[0], "DIAG-XSD-UNAVAILABLE");
});
