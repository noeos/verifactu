import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  defineXmlDocument,
  serializeXmlDocument,
} from "../../evidence/runs/artifacts/build/verifactu/dist/ports/xml-xsd.js";

const name = (localName, namespaceUri = "", prefix = null) => ({
  localName,
  namespaceUri,
  prefix,
});
const leaf = (value) => ({ kind: "text", value });

test("XML model freezes the tree and emits deterministic UTF-8 with expanded names", () => {
  const input = {
    root: {
      kind: "element",
      name: name("Root", "urn:example", "x"),
      namespaces: [
        { prefix: "x", namespaceUri: "urn:example" },
        { prefix: null, namespaceUri: "urn:default" },
        { prefix: "p", namespaceUri: "urn:attr" },
      ],
      attributes: [
        { name: name("z", "", null), value: "a\nb\t\"&" },
        { name: name("a", "urn:attr", "p"), value: "café €" },
      ],
      children: [
        leaf("<&>\r"),
        {
          kind: "element",
          name: name("item", "urn:default"),
          namespaces: [],
          attributes: [],
          children: [
            { kind: "comment", value: "safe comment" },
            { kind: "processing-instruction", target: "trace", data: "ok" },
          ],
        },
      ],
    },
  };
  const first = defineXmlDocument(input);
  const second = defineXmlDocument(input);
  assert.equal(first.status, "ok");
  assert.equal(second.status, "ok");
  assert.ok(Object.isFrozen(first.value.root));
  assert.ok(Object.isFrozen(first.value.root.namespaces));
  assert.equal(input.root.children[0].value, "<&>\r");
  const bytes = serializeXmlDocument(first.value);
  assert.equal(bytes.status, "ok");
  const xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes.value);
  assert.equal(xml, new TextDecoder().decode(serializeXmlDocument(second.value).value));
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/u);
  assert.match(xml, /xmlns="urn:default" xmlns:p="urn:attr" xmlns:x="urn:example"/u);
  assert.match(xml, / p:a="café €"/u);
  assert.match(xml, /z="a&#xA;b&#x9;&quot;&amp;"/u);
  assert.match(xml, /&lt;&amp;&gt;&#xD;/u);
  assert.match(xml, /<!--safe comment--><\?trace ok\?>/u);

  const parsed = JSON.parse(
    execFileSync(
      process.env.VERIFACTU_PYTHON ?? "python3",
      [
        "-I",
        "-c",
        "import json,sys; from lxml import etree; p=etree.XMLParser(load_dtd=False,no_network=True,resolve_entities=False,recover=False); r=etree.fromstring(sys.stdin.buffer.read(),p); print(json.dumps({'name':etree.QName(r).localname,'namespace':etree.QName(r).namespace,'nsmap':r.nsmap,'attributes':sorted(r.attrib.items()),'text':r.text,'child':etree.QName(r[0]).localname,'nodes':[('comment' if c.tag is etree.Comment else 'pi', (c.text if c.tag is etree.Comment else c.target), (None if c.tag is etree.Comment else c.text)) for c in r[0]]}))",
      ],
      {
        input: bytes.value,
        encoding: "utf8",
        timeout: 5_000,
        maxBuffer: 65_536,
      },
    ),
  );
  assert.deepEqual(parsed, {
    name: "Root",
    namespace: "urn:example",
    nsmap: { null: "urn:default", p: "urn:attr", x: "urn:example" },
    attributes: [
      ["z", 'a\nb\t"&'],
      ["{urn:attr}a", "café €"],
    ],
    text: "<&>\r",
    child: "item",
    nodes: [
      ["comment", "safe comment", null],
      ["pi", "trace", "ok"],
    ],
  });
});

test("XML model rejects malformed names, bindings, duplicate expanded attributes, and invalid text", () => {
  const base = {
    root: {
      kind: "element",
      name: name("r"),
      namespaces: [],
      attributes: [],
      children: [],
    },
  };
  const variants = [
    { ...base, root: { ...base.root, name: name("bad:name") } },
    {
      ...base,
      root: {
        ...base.root,
        name: name("r", "urn:bound", "missing"),
      },
    },
    {
      ...base,
      root: {
        ...base.root,
        namespaces: [{ prefix: "xml", namespaceUri: "urn:wrong" }],
      },
    },
    {
      ...base,
      root: {
        ...base.root,
        attributes: [
          { name: name("same", "urn:a", "a"), value: "1" },
          { name: name("same", "urn:a", "a"), value: "2" },
        ],
        namespaces: [{ prefix: "a", namespaceUri: "urn:a" }],
      },
    },
    { ...base, root: { ...base.root, children: [leaf("bad\u0001")] } },
    {
      ...base,
      root: { ...base.root, children: [{ kind: "comment", value: "bad--comment" }] },
    },
    {
      ...base,
      root: {
        ...base.root,
        children: [{ kind: "processing-instruction", target: "xml", data: "bad" }],
      },
    },
  ];
  for (const variant of variants) {
    const result = defineXmlDocument(variant);
    assert.equal(result.status, "invalid");
    assert.equal(result.diagnostics[0].code, "DIAG-XML-MODEL");
    assert.doesNotMatch(JSON.stringify(result), /bad:name|bad--comment/u);
  }
});

test("XML model distinguishes default element namespaces from unprefixed attributes", () => {
  const noDefaultNamespace = {
    root: {
      kind: "element",
      name: name("r", "urn:unexpected"),
      namespaces: [],
      attributes: [],
      children: [],
    },
  };
  const invalid = defineXmlDocument(noDefaultNamespace);
  assert.equal(invalid.status, "invalid");
  const valid = defineXmlDocument({
    root: {
      ...noDefaultNamespace.root,
      namespaces: [{ prefix: null, namespaceUri: "urn:expected" }],
      name: name("r", "urn:expected"),
      attributes: [{ name: name("plain", ""), value: "value" }],
    },
  });
  assert.equal(valid.status, "ok");
  assert.equal(serializeXmlDocument(valid.value).status, "ok");
});

test("XML model applies a total serialized-byte ceiling before allocating output", () => {
  const result = defineXmlDocument({
    root: {
      kind: "element",
      name: name("r"),
      namespaces: [],
      attributes: [{ name: name("a"), value: "&".repeat(900_000) }],
      children: [],
    },
  });
  assert.equal(result.status, "invalid");
  assert.equal(result.diagnostics[0].code, "DIAG-XML-MODEL");
});
