import { createHash } from "node:crypto";

import { assert } from "../../tooling/lib/policy.mjs";

export const XML_NAMESPACES = Object.freeze({
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/",
  xinclude: "http://www.w3.org/2001/XInclude",
});

export const DEFAULT_XML_LIMITS = Object.freeze({
  maximumBytes: 2_000_000,
  maximumDepth: 64,
  maximumNodes: 100_000,
  maximumAttributesPerElement: 128,
  maximumTextBytes: 8_000_000,
});

const NAME = /^[A-Za-z_][A-Za-z0-9_.:-]*/;
const NCNAME = /^[A-Za-z_][A-Za-z0-9_.-]*$/;
const XML_SPACE = /[ \t\r\n]/;
const PREDEFINED = new Map([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["apos", "'"],
  ["quot", '"'],
]);

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isXml10Character(codePoint) {
  return (
    codePoint === 0x09 ||
    codePoint === 0x0a ||
    codePoint === 0x0d ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  );
}

function assertXml10Characters(value) {
  for (const character of value) {
    assert(isXml10Character(character.codePointAt(0)), "XML_CHARACTER_INVALID", "XML contains a forbidden character");
  }
}

function decodeEntities(value) {
  let output = "";
  let cursor = 0;
  while (cursor < value.length) {
    const marker = value.indexOf("&", cursor);
    if (marker < 0) {
      output += value.slice(cursor);
      break;
    }
    output += value.slice(cursor, marker);
    const end = value.indexOf(";", marker + 1);
    assert(end >= 0, "XML_ENTITY_MALFORMED", "entity reference is not terminated");
    const entity = value.slice(marker + 1, end);
    if (PREDEFINED.has(entity)) output += PREDEFINED.get(entity);
    else {
      const hexadecimal = /^#x[0-9A-Fa-f]+$/.test(entity);
      const decimal = /^#[0-9]+$/.test(entity);
      assert(hexadecimal || decimal || !entity.startsWith("#"), "XML_ENTITY_MALFORMED", `&${entity}; is malformed`);
      assert(hexadecimal || decimal, "XML_ENTITY_FORBIDDEN", `&${entity}; is not predefined`);
      const numeric = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      assert(isXml10Character(numeric), "XML_CHARACTER_INVALID", `&${entity}; is not an XML 1.0 character`);
      output += String.fromCodePoint(numeric);
    }
    cursor = end + 1;
  }
  assertXml10Characters(output);
  return output;
}

function splitName(name) {
  const separator = name.indexOf(":");
  assert(separator === name.lastIndexOf(":"), "XML_NAME_INVALID", `${name} contains multiple namespace separators`);
  const parts =
    separator < 0
      ? { prefix: "", localName: name }
      : {
          prefix: name.slice(0, separator),
          localName: name.slice(separator + 1),
        };
  assert(
    (parts.prefix === "" || NCNAME.test(parts.prefix)) && NCNAME.test(parts.localName),
    "XML_NAME_INVALID",
    `${name} is not a valid QName`,
  );
  return parts;
}

function stripAllowlistedDoctype(text, source, sourceBytes) {
  const marker = text.indexOf("<!DOCTYPE");
  if (marker < 0) return text;
  assert(
    source.id === "W3C-XMLDSIG-XSD" && digest(sourceBytes) === source.sha256,
    "XML_DOCTYPE_FORBIDDEN",
    `${source.id} contains a non-allowlisted document type`,
  );
  let quote = "";
  let subsetDepth = 0;
  let cursor = marker + "<!DOCTYPE".length;
  for (; cursor < text.length; cursor += 1) {
    const character = text[cursor];
    if (quote) {
      if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "[") subsetDepth += 1;
    else if (character === "]") {
      assert(subsetDepth > 0, "XML_DOCTYPE_MALFORMED", "document type has an unmatched bracket");
      subsetDepth -= 1;
    } else if (character === ">" && subsetDepth === 0) {
      return `${text.slice(0, marker)}${text.slice(cursor + 1)}`;
    }
  }
  assert(false, "XML_DOCTYPE_MALFORMED", "document type is not terminated");
}

function parseStartTag(content) {
  let cursor = 0;
  const skipSpace = () => {
    while (XML_SPACE.test(content[cursor] ?? "")) cursor += 1;
  };
  const readName = () => {
    const match = NAME.exec(content.slice(cursor));
    assert(match, "XML_NAME_INVALID", `expected XML name near ${content.slice(cursor, cursor + 24)}`);
    cursor += match[0].length;
    return match[0];
  };
  skipSpace();
  const name = readName();
  splitName(name);
  const attributes = [];
  const rawNames = new Set();
  while (true) {
    skipSpace();
    if (cursor === content.length) break;
    const attributeName = readName();
    splitName(attributeName);
    assert(!rawNames.has(attributeName), "XML_ATTRIBUTE_DUPLICATE", `${name} repeats ${attributeName}`);
    rawNames.add(attributeName);
    skipSpace();
    assert(content[cursor] === "=", "XML_ATTRIBUTE_MALFORMED", `${attributeName} has no equals sign`);
    cursor += 1;
    skipSpace();
    const quote = content[cursor];
    assert(quote === '"' || quote === "'", "XML_ATTRIBUTE_MALFORMED", `${attributeName} is not quoted`);
    cursor += 1;
    const end = content.indexOf(quote, cursor);
    assert(end >= 0, "XML_ATTRIBUTE_MALFORMED", `${attributeName} is not terminated`);
    const rawValue = content.slice(cursor, end);
    assert(!rawValue.includes("<"), "XML_ATTRIBUTE_MALFORMED", `${attributeName} contains a raw less-than sign`);
    attributes.push({ name: attributeName, value: decodeEntities(rawValue) });
    cursor = end + 1;
  }
  return { name, attributes };
}

function findTagEnd(text, start) {
  let quote = "";
  for (let cursor = start; cursor < text.length; cursor += 1) {
    const character = text[cursor];
    if (quote) {
      if (character === quote) quote = "";
    } else if (character === '"' || character === "'") quote = character;
    else if (character === ">") return cursor;
  }
  return -1;
}

export function parseXml(sourceBytes, options = {}) {
  const limits = { ...DEFAULT_XML_LIMITS, ...(options.limits ?? {}) };
  assert(Buffer.isBuffer(sourceBytes), "XML_INPUT_INVALID", "XML input must be a Buffer");
  assert(sourceBytes.length <= limits.maximumBytes, "XML_BYTES_LIMIT", `XML exceeds ${limits.maximumBytes} bytes`);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes);
  } catch {
    assert(false, "XML_UTF8_INVALID", "XML is not well-formed UTF-8");
  }
  assertXml10Characters(text);
  assert(!text.includes("<!DOCTYPE"), "XML_DOCTYPE_FORBIDDEN", "document types are disabled");
  assert(!text.includes("<!ENTITY"), "XML_ENTITY_FORBIDDEN", "entity declarations are disabled");

  const document = { children: [] };
  const stack = [{ node: document, namespaces: new Map([["xml", XML_NAMESPACES.xml]]) }];
  let cursor = 0;
  let nodeCount = 0;
  let textBytes = 0;
  let declarationSeen = false;
  const addText = (raw) => {
    if (raw === "") return;
    assert(!raw.includes("]]>"), "XML_TEXT_MALFORMED", "character data contains the CDATA terminator");
    const value = decodeEntities(raw);
    textBytes += Buffer.byteLength(value);
    assert(textBytes <= limits.maximumTextBytes, "XML_TEXT_LIMIT", "XML text budget exceeded");
    if (stack.length === 1) {
      assert(value.trim() === "", "XML_TEXT_OUTSIDE_ROOT", "non-whitespace text occurs outside the root element");
    } else stack.at(-1).node.text += value;
  };

  while (cursor < text.length) {
    const opening = text.indexOf("<", cursor);
    if (opening < 0) {
      addText(text.slice(cursor));
      break;
    }
    addText(text.slice(cursor, opening));
    if (text.startsWith("<!--", opening)) {
      const end = text.indexOf("-->", opening + 4);
      assert(end >= 0, "XML_COMMENT_MALFORMED", "comment is not terminated");
      assert(!text.slice(opening + 4, end).includes("--"), "XML_COMMENT_MALFORMED", "comment contains --");
      cursor = end + 3;
      continue;
    }
    if (text.startsWith("<![CDATA[", opening)) {
      assert(stack.length > 1, "XML_TEXT_OUTSIDE_ROOT", "CDATA occurs outside the root element");
      const end = text.indexOf("]]>", opening + 9);
      assert(end >= 0, "XML_CDATA_MALFORMED", "CDATA is not terminated");
      const value = text.slice(opening + 9, end);
      textBytes += Buffer.byteLength(value);
      assert(textBytes <= limits.maximumTextBytes, "XML_TEXT_LIMIT", "XML text budget exceeded");
      stack.at(-1).node.text += value;
      cursor = end + 3;
      continue;
    }
    if (text.startsWith("<?", opening)) {
      const end = text.indexOf("?>", opening + 2);
      assert(end >= 0, "XML_PROCESSING_INSTRUCTION_FORBIDDEN", "processing instruction is not terminated");
      const instruction = text.slice(opening + 2, end);
      assert(
        !declarationSeen &&
          document.children.length === 0 &&
          opening === 0 &&
          /^xml[ \t\r\n]+version=(?:"1\.0"|'1\.0')(?:[ \t\r\n]+encoding=(?:"[Uu][Tt][Ff]-8"|'[Uu][Tt][Ff]-8'))?(?:[ \t\r\n]+standalone=(?:"(?:yes|no)"|'(?:yes|no)'))?[ \t\r\n]*$/.test(
            instruction,
          ),
        "XML_PROCESSING_INSTRUCTION_FORBIDDEN",
        "only an initial XML 1.0 UTF-8 declaration is allowed",
      );
      declarationSeen = true;
      cursor = end + 2;
      continue;
    }
    assert(!text.startsWith("<!", opening), "XML_DECLARATION_FORBIDDEN", "unsupported XML declaration");
    const end = findTagEnd(text, opening + 1);
    assert(end >= 0, "XML_TAG_MALFORMED", "tag is not terminated");
    let content = text.slice(opening + 1, end);
    if (content.startsWith("/")) {
      let closingName = content.slice(1);
      while (XML_SPACE.test(closingName.at(0) ?? "")) closingName = closingName.slice(1);
      while (XML_SPACE.test(closingName.at(-1) ?? "")) closingName = closingName.slice(0, -1);
      assert(
        NAME.test(closingName) && NAME.exec(closingName)[0] === closingName,
        "XML_NAME_INVALID",
        `${closingName} is invalid`,
      );
      splitName(closingName);
      assert(stack.length > 1, "XML_CLOSE_UNEXPECTED", `${closingName} has no open element`);
      assert(
        stack.at(-1).node.name === closingName,
        "XML_CLOSE_MISMATCH",
        `expected ${stack.at(-1).node.name}; got ${closingName}`,
      );
      stack.pop();
      cursor = end + 1;
      continue;
    }
    const selfClosing = /\/[ \t\r\n]*$/.test(content);
    if (selfClosing) content = content.replace(/\/[ \t\r\n]*$/, "");
    const parsed = parseStartTag(content);
    assert(
      parsed.attributes.length <= limits.maximumAttributesPerElement,
      "XML_ATTRIBUTE_LIMIT",
      `${parsed.name} has too many attributes`,
    );
    const parentNamespaces = stack.at(-1).namespaces;
    const namespaces = new Map(parentNamespaces);
    for (const attribute of parsed.attributes) {
      if (attribute.name === "xmlns") {
        assert(
          attribute.value !== XML_NAMESPACES.xml && attribute.value !== XML_NAMESPACES.xmlns,
          "XML_NAMESPACE_RESERVED",
          "default namespace uses a reserved namespace URI",
        );
        namespaces.set("", attribute.value);
      } else if (attribute.name.startsWith("xmlns:")) {
        const prefix = attribute.name.slice(6);
        assert(prefix !== "xml" && prefix !== "xmlns", "XML_NAMESPACE_RESERVED", `${prefix} is reserved`);
        assert(
          attribute.value.length > 0 &&
            attribute.value !== XML_NAMESPACES.xml &&
            attribute.value !== XML_NAMESPACES.xmlns,
          "XML_NAMESPACE_RESERVED",
          `${prefix} uses a reserved or empty namespace URI`,
        );
        namespaces.set(prefix, attribute.value);
      }
    }
    const elementName = splitName(parsed.name);
    const namespace = namespaces.get(elementName.prefix);
    assert(elementName.prefix === "" || namespace, "XML_NAMESPACE_UNBOUND", `${elementName.prefix} is unbound`);
    assert(namespace !== XML_NAMESPACES.xinclude, "XML_XINCLUDE_FORBIDDEN", "XInclude elements are disabled");
    const expandedAttributes = new Set();
    const attributes = parsed.attributes.map((attribute) => {
      if (attribute.name === "xmlns" || attribute.name.startsWith("xmlns:")) {
        return {
          ...attribute,
          prefix: "xmlns",
          localName: attribute.name === "xmlns" ? "" : attribute.name.slice(6),
          namespace: XML_NAMESPACES.xmlns,
        };
      }
      const parts = splitName(attribute.name);
      const attributeNamespace = parts.prefix ? namespaces.get(parts.prefix) : "";
      assert(!parts.prefix || attributeNamespace, "XML_NAMESPACE_UNBOUND", `${parts.prefix} is unbound`);
      const expanded = `{${attributeNamespace}}${parts.localName}`;
      assert(!expandedAttributes.has(expanded), "XML_ATTRIBUTE_DUPLICATE", `${parsed.name} repeats ${expanded}`);
      expandedAttributes.add(expanded);
      return { ...attribute, ...parts, namespace: attributeNamespace };
    });
    const node = {
      name: parsed.name,
      ...elementName,
      namespace: namespace ?? "",
      namespaceDeclarations: Object.fromEntries(
        parsed.attributes
          .filter(({ name }) => name === "xmlns" || name.startsWith("xmlns:"))
          .map(({ name, value }) => [name === "xmlns" ? "" : name.slice(6), value])
          .sort(([left], [right]) => left.localeCompare(right, "en")),
      ),
      namespaceBindings: Object.fromEntries([...namespaces].sort(([left], [right]) => left.localeCompare(right, "en"))),
      attributes,
      children: [],
      text: "",
    };
    nodeCount += 1;
    assert(nodeCount <= limits.maximumNodes, "XML_NODE_LIMIT", "XML node budget exceeded");
    assert(stack.length <= limits.maximumDepth, "XML_DEPTH_LIMIT", `XML exceeds depth ${limits.maximumDepth}`);
    stack.at(-1).node.children.push(node);
    if (!selfClosing) stack.push({ node, namespaces });
    cursor = end + 1;
  }
  assert(stack.length === 1, "XML_UNCLOSED_ELEMENT", `${stack.at(-1).node.name} is not closed`);
  assert(
    document.children.length === 1,
    "XML_ROOT_COUNT_INVALID",
    `expected one root; observed ${document.children.length}`,
  );
  return { root: document.children[0], nodeCount, textBytes };
}

export function parsePinnedXml(source, sourceBytes, options = {}) {
  assert(digest(sourceBytes) === source.sha256, "SOURCE_SHA256_MISMATCH", `${source.id} changed before parsing`);
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes);
  const prepared = Buffer.from(stripAllowlistedDoctype(decoded, source, sourceBytes), "utf8");
  return {
    ...parseXml(prepared, options),
    sourceSha256: source.sha256,
    doctypeNeutralized: prepared.length !== sourceBytes.length,
  };
}

export function attribute(node, name) {
  return node.attributes.find((candidate) => candidate.name === name)?.value;
}

export function descendants(node, predicate, output = []) {
  if (predicate(node)) output.push(node);
  for (const child of node.children) descendants(child, predicate, output);
  return output;
}
