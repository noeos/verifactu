import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadXmlProvider } from "../support/p4c-xml.mjs";

const { DEFAULT_XML_LIMITS, scanXmlResources, validateXmlXsd } =
  await loadXmlProvider();
const encode = (value) => new TextEncoder().encode(value);
const schemaBytes = encode(
  '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="root" type="xs:anyType"/></xs:schema>',
);
const schema = {
  id: "memory:///root.xsd",
  bytes: schemaBytes,
  sha256: createHash("sha256").update(schemaBytes).digest("hex"),
};
const request = (xml = "<root/>") => ({
  xml: encode(xml),
  rootSchemaId: schema.id,
  schemas: [schema],
  semanticStatus: "not-evaluated",
});
const denied = (xml, limits, code) => {
  const result = validateXmlXsd(request(xml), {
    limits: { ...DEFAULT_XML_LIMITS, ...limits },
    worker: () => assert.fail("worker must not run"),
  });
  assert.equal(result.status, "limit");
  assert.deepEqual(result.diagnostics, [code]);
};

test("XML and schema byte/resource-count limits fail before parsing", () => {
  denied("<root/>", { maximumXmlBytes: 1 }, "DIAG-XML-BYTES");
  const result = validateXmlXsd(request(), {
    limits: { ...DEFAULT_XML_LIMITS, maximumSchemaBytes: 1 },
    worker: () => assert.fail("worker must not run"),
  });
  assert.deepEqual(result.diagnostics, ["DIAG-XSD-RESOURCES"]);
});

test("depth, node, attribute, namespace and text limits are independent", () => {
  denied("<root><a><b/></a></root>", { maximumDepth: 2 }, "DIAG-XML-DEPTH");
  denied("<root><a/><b/></root>", { maximumNodes: 2 }, "DIAG-XML-NODES");
  denied(
    '<root a="1" b="2"/>',
    { maximumAttributes: 1 },
    "DIAG-XML-ATTRIBUTES",
  );
  denied(
    '<root xmlns:a="urn:a" xmlns:b="urn:b"/>',
    { maximumNamespaces: 1 },
    "DIAG-XML-NAMESPACES",
  );
  denied("<root>abcd</root>", { maximumTextBytes: 3 }, "DIAG-XML-TEXT");
});

test("deadline and cancellation have exact fail-closed outcomes", () => {
  let receivedTimeout;
  const deadline = validateXmlXsd(request(), {
    deadlineMs: 7,
    worker: (workerRequest, options) => {
      receivedTimeout = options.timeoutMs;
      assert.equal(
        workerRequest.cpuSeconds,
        DEFAULT_XML_LIMITS.maximumCpuSeconds,
      );
      return { kind: "limit", diagnostics: ["DIAG-XML-DEADLINE"] };
    },
  });
  assert.equal(receivedTimeout, 7);
  assert.equal(deadline.status, "limit");

  const controller = new AbortController();
  controller.abort();
  const cancelled = validateXmlXsd(request(), {
    signal: controller.signal,
    worker: () => assert.fail("worker must not run"),
  });
  assert.equal(cancelled.status, "cancelled");
});

test("invalid limit configuration fails closed", () => {
  const result = validateXmlXsd(request(), {
    limits: { ...DEFAULT_XML_LIMITS, maximumDepth: 0 },
  });
  assert.equal(result.status, "defect");
});

test("scanner rejects truncation, premature close and invalid UTF-8 without invoking XSD", () => {
  for (const xml of ["<!--", "<![CDATA[", "<root>", "</root>", '<root a="x>']) {
    const result = validateXmlXsd(request(xml), {
      worker: () => assert.fail("syntax error reached worker"),
    });
    assert.equal(result.status, "invalid");
    assert.deepEqual(result.diagnostics, ["DIAG-XML-SYNTAX"]);
  }
  const invalidUtf8 = {
    ...request(),
    xml: Uint8Array.from([0xff]),
  };
  const result = validateXmlXsd(invalidUtf8, {
    worker: () => assert.fail("invalid UTF-8 reached worker"),
  });
  assert.equal(result.status, "defect");
  assert.deepEqual(result.diagnostics, ["DIAG-XML-UTF8"]);
});

test("resource thresholds permit exact boundaries and reject the next unit", () => {
  const exact = validateXmlXsd(request("<root/>"), {
    limits: { ...DEFAULT_XML_LIMITS, maximumXmlBytes: 7 },
    worker: () => ({ kind: "valid", diagnostics: [] }),
  });
  assert.equal(exact.status, "valid");
  denied("<root/>", { maximumXmlBytes: 6 }, "DIAG-XML-BYTES");
});

test("resource scanner counts lexical constructs and exact thresholds", () => {
  const limits = (overrides) => ({
    ...DEFAULT_XML_LIMITS,
    maximumDepth: 2,
    maximumNodes: 4,
    maximumAttributes: 2,
    maximumNamespaces: 1,
    maximumTextBytes: 4,
    ...overrides,
  });
  assert.equal(scanXmlResources("<?xml version=\"1.0\"?><root/>", limits({ maximumNodes: 1 })), null);
  assert.equal(scanXmlResources("<!-- ok --><root/>", limits({ maximumNodes: 2 })), null);
  assert.equal(scanXmlResources("<![CDATA[abcd]]><root/>", limits()), null);
  assert.equal(scanXmlResources("<root a=\"1\" b='2'/>", limits()), null);
  assert.equal(scanXmlResources('<root xmlns="urn:test"/>', limits()), null);
  assert.equal(scanXmlResources("<root><child/></root>", limits()), null);
  assert.equal(scanXmlResources("text", limits()), null);
  assert.equal(scanXmlResources("<![CDATA[abcde]]><root/>", limits()), "DIAG-XML-TEXT");
  assert.equal(scanXmlResources("<!-- ok --><root/>", limits({ maximumNodes: 1 })), "DIAG-XML-NODES");
  assert.equal(scanXmlResources("<root a=\"1\" b='2'/>", limits({ maximumAttributes: 1 })), "DIAG-XML-ATTRIBUTES");
  assert.equal(scanXmlResources('<root xmlns="a" xmlns:x="b"/>', limits()), "DIAG-XML-NAMESPACES");
  assert.equal(scanXmlResources("<root><child><deep/></child></root>", limits()), "DIAG-XML-DEPTH");
  for (const xml of ["<root", "<!--", "<![CDATA[", "<!bogus>", "</root>"])
    assert.equal(scanXmlResources(xml, limits()), "DIAG-XML-SYNTAX");
});
