import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  defineXmlDocument,
  serializeXmlDocument,
  XML_LIMITS,
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
        { name: name("z", "", null), value: 'a\nb\t"&' },
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
  assert.equal(
    xml,
    new TextDecoder().decode(serializeXmlDocument(second.value).value),
  );
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/u);
  assert.match(
    xml,
    /xmlns="urn:default" xmlns:p="urn:attr" xmlns:x="urn:example"/u,
  );
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

test("XML model sorts attributes deterministically when namespace keys are equal", () => {
  const render = (attributes) => {
    const document = defineXmlDocument({
      root: {
        kind: "element",
        name: name("r"),
        namespaces: [],
        attributes,
        children: [],
      },
    });
    assert.equal(document.status, "ok");
    const serialized = serializeXmlDocument(document.value);
    assert.equal(serialized.status, "ok");
    return new TextDecoder().decode(serialized.value);
  };
  const first = [
    { name: name("z"), value: "last" },
    { name: name("a"), value: "first" },
  ];
  const reversed = [...first].reverse();
  assert.equal(render(first), render(reversed));
  assert.match(render(first), /<r a="first" z="last"\/>/u);
});

test("P4-PROP-010 XML model serialize-parse preserves supported infoset (4096 executions)", (t) => {
  const seed = 0x50444310;
  const documents = [];
  const expected = [];
  const corpus = createHash("sha256");
  const namespaceHistogram = Array(97).fill(0);
  for (let index = 0; index < 4096; index += 1) {
    const namespaceUri = `urn:p4:${(index + seed) % 97}`;
    namespaceHistogram[(index + seed) % 97] += 1;
    const text = `value-${seed}-${index}-${(index * 7919) % 65521}`;
    const defined = defineXmlDocument({
      root: {
        kind: "element",
        name: name("root", namespaceUri, "p"),
        namespaces: [{ prefix: "p", namespaceUri }],
        attributes: [{ name: name("index"), value: String(index) }],
        children: [
          {
            kind: "element",
            name: name("value", namespaceUri, "p"),
            namespaces: [],
            attributes: [],
            children: [leaf(text)],
          },
        ],
      },
    });
    assert.equal(defined.status, "ok", `seed=${seed} case=${index}`);
    const serialized = serializeXmlDocument(defined.value);
    assert.equal(serialized.status, "ok", `seed=${seed} case=${index}`);
    documents.push(Buffer.from(serialized.value).toString("base64"));
    corpus.update(Buffer.from(serialized.value));
    corpus.update(Buffer.from([0]));
    expected.push(["root", namespaceUri, String(index), "value", text]);
  }
  const parsed = JSON.parse(
    execFileSync(
      process.env.VERIFACTU_PYTHON ?? "python3",
      [
        "-I",
        "-c",
        "import base64,json,sys; from lxml import etree; p=etree.XMLParser(load_dtd=False,no_network=True,resolve_entities=False,recover=False); out=[]; [out.append([etree.QName(r).localname,etree.QName(r).namespace,r.get('index'),etree.QName(r[0]).localname,r[0].text]) for r in (etree.fromstring(base64.b64decode(v),p) for v in json.load(sys.stdin))]; print(json.dumps(out,separators=(',',':')))",
      ],
      {
        input: JSON.stringify(documents),
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 4 * 1024 * 1024,
      },
    ),
  );
  assert.deepEqual(parsed, expected);
  t.diagnostic(
    `P4-PROP-010 executions=4096 seed=${seed} discards=0 corpusSha256=${corpus.digest("hex")} namespaceHistogram=${namespaceHistogram.join(",")}`,
  );
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
    { ...base, root: { ...base.root, name: name("") } },
    { ...base, root: { ...base.root, name: name("1starts-with-digit") } },
    { ...base, root: { ...base.root, name: name("contains?invalid") } },
    { ...base, root: { ...base.root, name: name(new String("r")) } },
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
      root: {
        ...base.root,
        children: [{ kind: "comment", value: "bad--comment" }],
      },
    },
    {
      ...base,
      root: {
        ...base.root,
        children: [
          { kind: "processing-instruction", target: "xml", data: "bad" },
        ],
      },
    },
  ];
  for (const variant of variants) {
    const result = defineXmlDocument(variant);
    assert.equal(result.status, "invalid");
    assert.equal(result.diagnostics[0].code, "DIAG-XML-MODEL");
    assert.doesNotMatch(JSON.stringify(result), /bad:name|bad--comment/u);
  }

  for (const input of [null, {}, { root: null }]) {
    const result = defineXmlDocument(input);
    assert.equal(result.status, "invalid");
    assert.equal(result.diagnostics[0].code, "DIAG-XML-MODEL");
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

test("XML serializer orders expanded attributes by namespace then local name", () => {
  const defined = defineXmlDocument({
    root: {
      kind: "element",
      name: name("root"),
      namespaces: [
        { prefix: "z", namespaceUri: "urn:z" },
        { prefix: "a", namespaceUri: "urn:a" },
      ],
      attributes: [
        { name: name("z", "urn:z", "z"), value: "z" },
        { name: name("z", "urn:a", "a"), value: "second" },
        { name: name("a", "urn:a", "a"), value: "first" },
      ],
      children: [],
    },
  });
  assert.equal(defined.status, "ok");
  const serialized = serializeXmlDocument(defined.value);
  assert.equal(serialized.status, "ok");
  assert.equal(
    new TextDecoder("utf-8", { fatal: true }).decode(serialized.value),
    '<?xml version="1.0" encoding="UTF-8"?><root xmlns:a="urn:a" xmlns:z="urn:z" a:a="first" a:z="second" z:z="z"/>',
  );
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

test("XML model accounts for serialized bytes in every node class", () => {
  const limit = XML_LIMITS.maximumXmlBytes;
  const element = (overrides = {}) => ({
    kind: "element",
    name: name("r"),
    namespaces: [],
    attributes: [],
    children: [],
    ...overrides,
  });
  const declarationBytes = "n".repeat(limit);
  const attributeBytes = "a".repeat(XML_LIMITS.maximumTextBytes - 2);
  const commentBytes = "c".repeat(XML_LIMITS.maximumTextBytes);
  const textBytes = "&".repeat(900_000);
  const overLimitDocuments = [
    { root: element({ name: name("r".repeat(limit)) }) },
    {
      root: element({
        name: name("r", declarationBytes, "p"),
        namespaces: [{ prefix: "p", namespaceUri: declarationBytes }],
      }),
    },
    { root: element({ children: [leaf(textBytes)] }) },
    {
      root: element({
        attributes: [{ name: name("a"), value: attributeBytes }],
        children: [{ kind: "comment", value: commentBytes }],
      }),
    },
    {
      root: element({
        attributes: [{ name: name("a"), value: attributeBytes }],
        children: [
          { kind: "processing-instruction", target: "p", data: commentBytes },
        ],
      }),
    },
  ];
  for (const document of overLimitDocuments)
    assert.equal(defineXmlDocument(document).status, "invalid");
});

test("XML model rejects exact one-byte serialized overflows in each markup class", () => {
  const limit = XML_LIMITS.maximumXmlBytes;
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
  const encoder = new TextEncoder();
  const element = (overrides = {}) => ({
    kind: "element",
    name: name("r"),
    namespaces: [],
    attributes: [],
    children: [],
    ...overrides,
  });
  const makeDocument = (root) => ({ root });
  const exact = (value) => encoder.encode(value).byteLength;

  const textBase = exact(`${declaration}<r></r>`);
  const textCharacters = (limit + 1 - textBase) / 5;
  assert.equal(Number.isInteger(textCharacters), true);
  assert.equal(
    exact(`${declaration}<r>${"&amp;".repeat(textCharacters)}</r>`),
    limit + 1,
  );
  assert.equal(
    defineXmlDocument(
      makeDocument(element({ children: [leaf("&".repeat(textCharacters))] })),
    ).status,
    "invalid",
  );

  const attributeBase = exact(`${declaration}<r a=""/>`);
  const attributeCharacters = (limit + 1 - attributeBase) / 6;
  assert.equal(Number.isInteger(attributeCharacters), true);
  assert.equal(
    exact(`${declaration}<r a="${"&quot;".repeat(attributeCharacters)}"/>`),
    limit + 1,
  );
  assert.equal(
    defineXmlDocument(
      makeDocument(
        element({
          attributes: [
            { name: name("a"), value: '"'.repeat(attributeCharacters) },
          ],
        }),
      ),
    ).status,
    "invalid",
  );

  const instructionBase = exact(`${declaration}<r><??></r>`);
  const instructionTargetLength = limit + 1 - instructionBase;
  const instructionTarget = "t".repeat(instructionTargetLength);
  assert.equal(
    exact(`${declaration}<r><?${instructionTarget}?></r>`),
    limit + 1,
  );
  assert.equal(
    defineXmlDocument(
      makeDocument(
        element({
          children: [
            {
              kind: "processing-instruction",
              target: instructionTarget,
              data: "",
            },
          ],
        }),
      ),
    ).status,
    "invalid",
  );

  const namespaceBase = exact(`${declaration}<p:r xmlns:p=""/>`);
  const namespaceUri = "n".repeat(limit + 1 - namespaceBase);
  assert.equal(
    exact(`${declaration}<p:r xmlns:p="${namespaceUri}"/>`),
    limit + 1,
  );
  assert.equal(
    defineXmlDocument(
      makeDocument(
        element({
          name: name("r", namespaceUri, "p"),
          namespaces: [{ prefix: "p", namespaceUri }],
        }),
      ),
    ).status,
    "invalid",
  );

  const filler = (bytes) =>
    "&".repeat(Math.floor(bytes / 5)) + "x".repeat(bytes % 5);
  for (const [child, serializedNode] of [
    [{ kind: "comment", value: "x" }, "<!--x-->"],
    [{ kind: "processing-instruction", target: "p", data: "" }, "<?p?>"],
    [{ kind: "processing-instruction", target: "p", data: "xy" }, "<?p xy?>"],
  ]) {
    const fixed = exact(`${declaration}<r>${serializedNode}</r>`);
    const text = filler(limit + 1 - fixed);
    assert.equal(
      exact(
        `${declaration}<r>${text.replaceAll("&", "&amp;")}${serializedNode}</r>`,
      ),
      limit + 1,
    );
    assert.equal(
      defineXmlDocument(
        makeDocument(element({ children: [leaf(text), child] })),
      ).status,
      "invalid",
    );
  }

  const namespaceFixed = exact(`${declaration}<p:r xmlns:p=""/>`);
  const quoteNamespaceCharacters = limit + 1 - namespaceFixed - 5;
  const quoteNamespaceUri = "n".repeat(quoteNamespaceCharacters - 1) + '"';
  assert.equal(
    exact(
      `${declaration}<p:r xmlns:p="${quoteNamespaceUri.replaceAll('"', "&quot;")}"/>`,
    ),
    limit + 1,
  );
  assert.equal(
    defineXmlDocument(
      makeDocument(
        element({
          name: name("r", quoteNamespaceUri, "p"),
          namespaces: [{ prefix: "p", namespaceUri: quoteNamespaceUri }],
        }),
      ),
    ).status,
    "invalid",
  );
});

test("XML model fails closed across namespace, attribute, node, and text boundaries", () => {
  const document = (overrides = {}) => ({
    root: {
      kind: "element",
      name: name("r"),
      namespaces: [],
      attributes: [],
      children: [],
      ...overrides,
    },
  });
  const invalidDocuments = [
    document({ namespaces: null }),
    document({ namespaces: [null] }),
    document({ namespaces: [{ prefix: null, namespaceUri: "bad\u0000uri" }] }),
    document({ namespaces: [{ prefix: "p", namespaceUri: "bad\u0000uri" }] }),
    document({ namespaces: [{ prefix: 1, namespaceUri: "urn:x" }] }),
    document({
      namespaces: [
        { prefix: "p", namespaceUri: "urn:x" },
        { prefix: "p", namespaceUri: "urn:y" },
      ],
    }),
    document({ namespaces: [{ prefix: "bad:name", namespaceUri: "urn:x" }] }),
    document({ namespaces: [{ prefix: "xmlns", namespaceUri: "urn:x" }] }),
    document({
      namespaces: [
        { prefix: "p", namespaceUri: "http://www.w3.org/2000/xmlns/" },
      ],
    }),
    document({ namespaces: [{ prefix: "xml", namespaceUri: "urn:not-xml" }] }),
    document({
      namespaces: [
        { prefix: "p", namespaceUri: "http://www.w3.org/XML/1998/namespace" },
      ],
    }),
    document({ namespaces: [{ prefix: "p", namespaceUri: "" }] }),
    document({ name: name("r", "urn:missing", "p") }),
    document({ name: { ...name("r"), localName: 1 } }),
    document({ attributes: null }),
    document({ attributes: [null] }),
    document({ attributes: [{ name: name("xmlns"), value: "x" }] }),
    document({ attributes: [{ name: name("a"), value: 1 }] }),
    document({ attributes: [{ name: name("a"), value: "bad\u0001" }] }),
    document({
      attributes: [{ name: name("a", "urn:missing", "p"), value: "x" }],
    }),
    document({
      attributes: [
        { name: name("a"), value: "x" },
        { name: name("a"), value: "y" },
      ],
    }),
    document({ children: null }),
    document({ children: [null] }),
    document({ children: [false] }),
    document({ children: [{ kind: "unknown" }] }),
    document({ children: [{ kind: "comment", value: 1 }] }),
    document({ children: [{ kind: "comment", value: "trailing-" }] }),
    document({ children: [{ kind: "comment", value: "bad\u0000comment" }] }),
    document({
      children: [
        { kind: "processing-instruction", target: "bad:name", data: "" },
      ],
    }),
    document({
      children: [
        { kind: "processing-instruction", target: "trace", data: "bad?>data" },
      ],
    }),
    document({
      children: [
        { kind: "processing-instruction", target: "trace", data: "bad\u0000" },
      ],
    }),
    document({ children: [leaf("x".repeat(2_097_153))] }),
  ];
  let nested = document().root;
  for (let index = 0; index < 65; index += 1) {
    nested = {
      kind: "element",
      name: name("n"),
      namespaces: [],
      attributes: [],
      children: [nested],
    };
  }
  invalidDocuments.push({ root: nested });
  invalidDocuments.push(
    document({ children: Array.from({ length: 100_001 }, () => leaf("")) }),
  );
  invalidDocuments.push(
    document({
      attributes: Array.from({ length: 4_097 }, (_, index) => ({
        name: name(`a${index}`),
        value: "",
      })),
    }),
  );
  invalidDocuments.push(
    document({
      namespaces: Array.from({ length: 257 }, (_, index) => ({
        prefix: `p${index}`,
        namespaceUri: `urn:${index}`,
      })),
    }),
  );
  for (const input of invalidDocuments) {
    const result = defineXmlDocument(input);
    assert.equal(result.status, "invalid");
    assert.equal(result.diagnostics[0].code, "DIAG-XML-MODEL");
  }
});

test("XML model stops traversing siblings after serialized bytes overflow", () => {
  let visited = false;
  const unvisited = {};
  Object.defineProperty(unvisited, "kind", {
    get() {
      visited = true;
      throw new Error("XML sibling visited after a fatal byte overflow");
    },
  });
  const result = defineXmlDocument({
    root: {
      kind: "element",
      name: name("r"),
      namespaces: [],
      attributes: [],
      children: [leaf("&".repeat(900_000)), unvisited],
    },
  });
  assert.equal(result.status, "invalid");
  assert.equal(visited, false);
});

test("XML model accounts for quotes as text without attribute expansion", () => {
  const text = '"'.repeat(700_000);
  const document = defineXmlDocument({
    root: {
      kind: "element",
      name: name("r"),
      namespaces: [],
      attributes: [],
      children: [leaf(text)],
    },
  });
  assert.equal(document.status, "ok");
  const serialized = serializeXmlDocument(document.value);
  assert.equal(serialized.status, "ok");
  assert.equal(
    serialized.value.byteLength,
    new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8"?><r>' + text + "</r>",
    ).byteLength,
  );
});

test("XML model rejects maximum-length names before scanning their characters", () => {
  const originalTest = RegExp.prototype.test;
  let regularExpressionCalls = 0;
  RegExp.prototype.test = function (value) {
    regularExpressionCalls += 1;
    return originalTest.call(this, value);
  };
  try {
    const result = defineXmlDocument({
      root: {
        kind: "element",
        name: name("a".repeat(XML_LIMITS.maximumXmlBytes)),
        namespaces: [],
        attributes: [],
        children: [],
      },
    });
    assert.equal(result.status, "invalid");
    assert.equal(regularExpressionCalls, 0);
  } finally {
    RegExp.prototype.test = originalTest;
  }
});

test("XML model enforces the text byte ceiling for three-byte characters", () => {
  const text = "ࠀ".repeat(699_051);
  assert.equal(
    defineXmlDocument({
      root: {
        kind: "element",
        name: name("r"),
        namespaces: [],
        attributes: [],
        children: [leaf(text)],
      },
    }).status,
    "invalid",
  );
});

test("XML model enforces the text byte ceiling for supplementary characters", () => {
  const text = "𐀀".repeat(524_289);
  assert.equal(
    defineXmlDocument({
      root: {
        kind: "element",
        name: name("r"),
        namespaces: [],
        attributes: [],
        children: [leaf(text)],
      },
    }).status,
    "invalid",
  );
});

test("XML model counts DEL as one UTF-8 text byte", () => {
  const text = "\u007f".repeat(1_048_577);
  assert.equal(
    defineXmlDocument({
      root: {
        kind: "element",
        name: name("r"),
        namespaces: [],
        attributes: [],
        children: [leaf(text)],
      },
    }).status,
    "ok",
  );
});

test("XML model stops counting escaped text at the serialized byte ceiling", () => {
  const ceiling = XML_LIMITS.maximumXmlBytes;
  const escapedPrefix = "&".repeat(Math.floor(ceiling / 5));
  const escapedRemainder = "x".repeat(ceiling % 5);
  const text = `${escapedPrefix}${escapedRemainder}z`;
  const originalIterator = String.prototype[Symbol.iterator];
  let inspectedCharacters = 0;
  String.prototype[Symbol.iterator] = function () {
    const iterator = originalIterator.call(this);
    if (this !== text) return iterator;
    return {
      next() {
        const next = iterator.next();
        if (!next.done) inspectedCharacters += 1;
        return next;
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  };
  try {
    const result = defineXmlDocument({
      root: {
        kind: "element",
        name: name("r"),
        namespaces: [],
        attributes: [],
        children: [leaf(text)],
      },
    });
    assert.equal(result.status, "invalid");
    assert.equal(
      inspectedCharacters,
      2 * text.length + escapedPrefix.length + escapedRemainder.length,
    );
  } finally {
    String.prototype[Symbol.iterator] = originalIterator;
  }
});

test("XML model accepts the complete valid scalar ranges and empty processing instructions", () => {
  const document = {
    root: {
      kind: "element",
      name: name("𐀀Root", "urn:unicode", "u"),
      namespaces: [
        { prefix: "u", namespaceUri: "urn:unicode" },
        { prefix: "xml", namespaceUri: "http://www.w3.org/XML/1998/namespace" },
      ],
      attributes: [
        {
          name: name("lang", "http://www.w3.org/XML/1998/namespace", "xml"),
          value: "ñ\uE000😀'\"",
        },
      ],
      children: [
        leaf(' \u007F\u07FF\uD7FF\uE000\uFFFD𐀀􏿿"\n\t'),
        { kind: "processing-instruction", target: "trace", data: "" },
      ],
    },
  };
  const defined = defineXmlDocument(document);
  assert.equal(defined.status, "ok");
  const serialized = serializeXmlDocument(defined.value);
  assert.equal(serialized.status, "ok");
  const xml = new TextDecoder().decode(serialized.value);
  assert.match(xml, /𐀀Root/u);
  assert.match(xml, /ñ\uE000😀/u);
  assert.match(xml, /\u007F\u07FF\uD7FF\uE000\uFFFD𐀀􏿿/u);
  assert.match(xml, /􏿿"\n\t<\?trace\?>/u);
});

test("XML model accepts each documented exact capacity", () => {
  const documentElement = (overrides = {}) => ({
    kind: "element",
    name: name("r"),
    namespaces: [],
    attributes: [],
    children: [],
    ...overrides,
  });
  const exactNodes = {
    root: documentElement({
      children: Array.from({ length: XML_LIMITS.maximumNodes - 1 }, () =>
        leaf(""),
      ),
    }),
  };
  assert.equal(defineXmlDocument(exactNodes).status, "ok");
  const exactElementNodes = {
    root: documentElement({
      children: Array.from({ length: XML_LIMITS.maximumNodes - 1 }, () =>
        documentElement(),
      ),
    }),
  };
  assert.equal(defineXmlDocument(exactElementNodes).status, "ok");

  let exactDepth = documentElement();
  for (let depth = 1; depth < XML_LIMITS.maximumDepth; depth += 1)
    exactDepth = documentElement({ children: [exactDepth] });
  assert.equal(defineXmlDocument({ root: exactDepth }).status, "ok");

  assert.equal(
    defineXmlDocument({
      root: documentElement({
        attributes: Array.from(
          { length: XML_LIMITS.maximumAttributes },
          (_, index) => ({ name: name(`a${index}`), value: "" }),
        ),
      }),
    }).status,
    "ok",
  );
  assert.equal(
    defineXmlDocument({
      root: documentElement({
        namespaces: Array.from(
          { length: XML_LIMITS.maximumNamespaces },
          (_, index) => ({ prefix: `p${index}`, namespaceUri: `urn:${index}` }),
        ),
      }),
    }).status,
    "ok",
  );

  const exactText = defineXmlDocument({
    root: documentElement({
      children: [leaf("x".repeat(XML_LIMITS.maximumTextBytes))],
    }),
  });
  assert.equal(exactText.status, "ok");
  const exactAttribute = defineXmlDocument({
    root: documentElement({
      attributes: [
        { name: name("a"), value: "x".repeat(XML_LIMITS.maximumTextBytes) },
      ],
    }),
  });
  assert.equal(exactAttribute.status, "ok");

  const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
  const baselineBytes = new TextEncoder().encode(
    `${declaration}<r></r>`,
  ).byteLength;
  const remainingBytes = XML_LIMITS.maximumXmlBytes - baselineBytes;
  const exactTextWithUnescapedAttributeOnlyCharacters =
    "&".repeat(Math.floor((remainingBytes - 3) / 5)) +
    '"\n\t' +
    "x".repeat((remainingBytes - 3) % 5);
  const exactSpecialText = defineXmlDocument({
    root: documentElement({
      children: [leaf(exactTextWithUnescapedAttributeOnlyCharacters)],
    }),
  });
  assert.equal(exactSpecialText.status, "ok");
  assert.equal(
    serializeXmlDocument(exactSpecialText.value).value.byteLength,
    XML_LIMITS.maximumXmlBytes,
  );
  const ampersandCount = Math.floor(remainingBytes / 5);
  const exactMarkupText =
    "&".repeat(ampersandCount) + "x".repeat(remainingBytes % 5);
  const exactDocument = defineXmlDocument({
    root: documentElement({
      children: [leaf(exactMarkupText)],
    }),
  });
  assert.equal(exactDocument.status, "ok");
  const serialized = serializeXmlDocument(exactDocument.value);
  assert.equal(serialized.status, "ok");
  assert.equal(serialized.value.byteLength, XML_LIMITS.maximumXmlBytes);

  const namespaceBase = new TextEncoder().encode(
    `${declaration}<p:r xmlns:p=""/>`,
  ).byteLength;
  const exactNamespaceUri = "n".repeat(
    XML_LIMITS.maximumXmlBytes - namespaceBase,
  );
  const exactNamespaceDocument = defineXmlDocument({
    root: documentElement({
      name: name("r", exactNamespaceUri, "p"),
      namespaces: [{ prefix: "p", namespaceUri: exactNamespaceUri }],
    }),
  });
  assert.equal(exactNamespaceDocument.status, "ok");
  assert.equal(
    serializeXmlDocument(exactNamespaceDocument.value).value.byteLength,
    XML_LIMITS.maximumXmlBytes,
  );

  const encoder = new TextEncoder();
  for (const point of [
    0x7f, 0x7ff, 0xd7ff, 0xe000, 0xfffd, 0x10000, 0x10ffff,
  ]) {
    const scalar = String.fromCodePoint(point);
    const remainingScalarBytes =
      remainingBytes - encoder.encode(scalar).byteLength;
    const scalarAmpersands = Math.floor(remainingScalarBytes / 5);
    const scalarText =
      "&".repeat(scalarAmpersands) +
      scalar +
      "x".repeat(remainingScalarBytes % 5);
    assert.equal(
      defineXmlDocument({
        root: documentElement({ children: [leaf(scalarText)] }),
      }).status,
      "ok",
      `valid XML scalar U+${point.toString(16).toUpperCase()}`,
    );
  }
});
