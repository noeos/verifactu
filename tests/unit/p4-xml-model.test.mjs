import assert from "node:assert/strict";
import test from "node:test";

const subject = await import(
  process.env.VERIFACTU_TEST_ENTRY ??
    new URL(
      "../../evidence/runs/artifacts/build/verifactu/dist/index.js",
      import.meta.url,
    ).href
);

const name = (localName, namespaceUri = "urn:test", prefix = "t") => ({
  localName,
  namespaceUri,
  prefix,
});
const element = (overrides = {}) => ({
  kind: "element",
  name: name("Root"),
  namespaces: [{ prefix: "t", namespaceUri: "urn:test" }],
  attributes: [],
  children: [],
  ...overrides,
});

test("XML model freezes a valid expanded-name infoset", () => {
  const result = subject.defineXmlDocument({ root: element() });
  assert.equal(result.status, "succeeded");
  assert(Object.isFrozen(result.value));
  assert(Object.isFrozen(result.value.root));
  assert(Object.isFrozen(result.value.root.name));
  assert.deepEqual(result.value.root.name, name("Root"));
  assert(Object.isFrozen(result.value.root.namespaces));
});

test("serializer fixes declaration, namespaces, expanded attribute order and escaping", () => {
  const result = subject.serializeXmlDocument({
    root: element({
      attributes: [
        { name: name("z", "", null), value: 'a&"\r\n\t' },
        { name: name("a", "", null), value: "<" },
      ],
      children: [
        { kind: "text", value: "<&>\r" },
        { kind: "comment", value: "safe" },
      ],
    }),
  });
  assert.equal(result.status, "succeeded");
  assert.equal(
    new TextDecoder().decode(result.value),
    '<?xml version="1.0" encoding="UTF-8"?><t:Root xmlns:t="urn:test" a="&lt;" z="a&amp;&quot;&#xD;&#xA;&#x9;">&lt;&amp;&gt;&#xD;<!--safe--></t:Root>',
  );
});

test("serializer uses one deterministic empty-element form", () => {
  const result = subject.serializeXmlDocument({ root: element() });
  assert.equal(result.status, "succeeded");
  assert.match(
    new TextDecoder().decode(result.value),
    /<t:Root xmlns:t="urn:test"\/>$/u,
  );
});

test("serializer preserves an explicit default namespace and orders mixed bindings", () => {
  const result = subject.serializeXmlDocument({
    root: {
      kind: "element",
      name: name("Root", "urn:default", null),
      namespaces: [
        { prefix: "z", namespaceUri: "urn:z" },
        { prefix: null, namespaceUri: "urn:default" },
        { prefix: "a", namespaceUri: "urn:a" },
      ],
      attributes: [
        { name: name("z", "urn:z", "z"), value: "z" },
        { name: name("a", "urn:a", "a"), value: "a" },
      ],
      children: [],
    },
  });
  assert.equal(result.status, "succeeded");
  assert.equal(
    new TextDecoder().decode(result.value),
    '<?xml version="1.0" encoding="UTF-8"?><Root xmlns="urn:default" xmlns:a="urn:a" xmlns:z="urn:z" a:a="a" z:z="z"/>',
  );
});

test("model rejects duplicate expanded attributes and namespace prefixes", () => {
  for (const root of [
    element({
      attributes: [
        { name: name("a", "", null), value: "1" },
        { name: name("a", "", null), value: "2" },
      ],
    }),
    element({
      namespaces: [
        { prefix: "t", namespaceUri: "urn:test" },
        { prefix: "t", namespaceUri: "urn:other" },
      ],
    }),
  ]) {
    assert.equal(subject.defineXmlDocument({ root }).status, "invalid");
  }
});

test("model rejects unbound and reserved prefixes, invalid names and characters", () => {
  const cases = [
    element({ name: name("Root", "urn:test", "missing"), namespaces: [] }),
    element({
      namespaces: [{ prefix: "xml", namespaceUri: "urn:not-xml" }],
    }),
    element({
      namespaces: [{ prefix: "xmlns", namespaceUri: "urn:xmlns" }],
    }),
    element({
      namespaces: [
        { prefix: "xml", namespaceUri: "http://www.w3.org/XML/1998/namespace" },
      ],
      name: name("Root", "urn:test", "t"),
    }),
    element({
      namespaces: [
        { prefix: "a", namespaceUri: "http://www.w3.org/XML/1998/namespace" },
      ],
    }),
    element({ name: name("Root", "urn:test", "1bad") }),
    element({ name: name("bad:name") }),
    ...["\u0000", "\u001f", "\ufffe", "\uffff"].map((value) =>
      element({ children: [{ kind: "text", value }] }),
    ),
    element({ children: [{ kind: "comment", value: "bad--comment" }] }),
    element({ children: [{ kind: "comment", value: "bad-" }] }),
  ];
  for (const root of cases)
    assert.equal(subject.defineXmlDocument({ root }).status, "invalid");
});

test("default namespaces never apply implicitly to attributes", () => {
  const result = subject.defineXmlDocument({
    root: element({
      name: name("Root", "urn:test", null),
      namespaces: [{ prefix: null, namespaceUri: "urn:test" }],
      attributes: [{ name: name("a", "urn:test", null), value: "x" }],
    }),
  });
  assert.equal(result.status, "invalid");
});

test("model requires exact local, prefix and default-namespace bindings", () => {
  const cases = [
    element({ name: name("Root", "urn:test", null), namespaces: [] }),
    element({ name: name("Root", "urn:test", "t:") }),
    element({ name: name("Root", "urn:test", "xmlns") }),
    element({ name: name("Root", "http://www.w3.org/2000/xmlns/", "t") }),
    element({ name: name("Root", "urn:test", "xml") }),
    element({
      name: name("Root", "urn:test", "t"),
      namespaces: [{ prefix: "t", namespaceUri: "" }],
    }),
  ];
  for (const root of cases)
    assert.equal(subject.defineXmlDocument({ root }).status, "invalid");
  assert.equal(
    subject.defineXmlDocument({
      root: element({
        name: name("Root", "http://www.w3.org/XML/1998/namespace", "xml"),
        namespaces: [{ prefix: "t", namespaceUri: "urn:test" }],
      }),
    }).status,
    "succeeded",
  );
});

test("serialization propagates model failures as a failed result", () => {
  const result = subject.serializeXmlDocument({
    root: element({
      name: name("Root", "urn:test", "missing"),
      namespaces: [],
    }),
  });
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.diagnostics.map((item) => item.code), ["DIAG-XML-MODEL"]);
});

test("namespace and character constraints reject one violation at a time", () => {
  const unqualified = (overrides = {}) =>
    element({
      name: name("Root", "", null),
      namespaces: [],
      ...overrides,
    });
  for (const root of [
    unqualified({
      namespaces: [
        { prefix: "xml", namespaceUri: "urn:not-the-xml-namespace" },
      ],
    }),
    unqualified({
      namespaces: [{ prefix: "xmlns", namespaceUri: "urn:test" }],
    }),
    unqualified({
      namespaces: [
        { prefix: "t", namespaceUri: "http://www.w3.org/2000/xmlns/" },
      ],
    }),
    unqualified({
      name: name("Root", "urn:default", null),
      namespaces: [{ prefix: null, namespaceUri: "urn:other" }],
    }),
    unqualified({ children: [{ kind: "text", value: "\u0001" }] }),
    unqualified({ children: [{ kind: "text", value: "\ud800" }] }),
  ])
    assert.equal(subject.defineXmlDocument({ root }).status, "invalid");
  assert.equal(
    subject.defineXmlDocument({
      root: unqualified({
        children: [{ kind: "text", value: "\t\n\r valid" }],
      }),
    }).status,
    "succeeded",
  );
});
