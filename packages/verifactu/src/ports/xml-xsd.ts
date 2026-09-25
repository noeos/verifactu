import { invalid, ok, type Result } from "../contracts/results.js";

export interface XmlExpandedName {
  readonly namespaceUri: string;
  readonly prefix: string | null;
  readonly localName: string;
}

export interface XmlNamespaceBinding {
  readonly prefix: string | null;
  readonly namespaceUri: string;
}

export interface XmlAttribute {
  readonly name: XmlExpandedName;
  readonly value: string;
}

export interface XmlText {
  readonly kind: "text";
  readonly value: string;
}

export interface XmlComment {
  readonly kind: "comment";
  readonly value: string;
}

export interface XmlProcessingInstruction {
  readonly kind: "processing-instruction";
  readonly target: string;
  readonly data: string;
}

export interface XmlElement {
  readonly kind: "element";
  readonly name: XmlExpandedName;
  readonly namespaces: readonly XmlNamespaceBinding[];
  readonly attributes: readonly XmlAttribute[];
  readonly children: readonly XmlNode[];
}

export type XmlNode =
  | XmlElement
  | XmlText
  | XmlComment
  | XmlProcessingInstruction;

export interface XmlDocument {
  readonly root: XmlElement;
}

export type SemanticValidationStatus = "valid" | "invalid" | "not-evaluated";

export type XsdValidationStatus =
  | "valid"
  | "invalid"
  | "unavailable"
  | "limit"
  | "cancelled"
  | "defect";

export interface XmlSchemaResource {
  readonly id: string;
  readonly bytes: Uint8Array;
  readonly sha256: string;
}

export interface XmlXsdValidationRequest {
  readonly editionId: string;
  readonly xml: Uint8Array;
  readonly rootSchemaId: string;
  readonly schemas: readonly XmlSchemaResource[];
  readonly semanticStatus?: SemanticValidationStatus;
}

export interface XmlXsdValidationResult {
  readonly status: XsdValidationStatus;
  readonly xsd: "valid" | "invalid" | "not-evaluated";
  readonly semantic: SemanticValidationStatus;
  readonly diagnostics: readonly string[];
}

export interface XmlXsdLimits {
  readonly maximumXmlBytes: number;
  readonly maximumSchemaBytes: number;
  readonly maximumSchemas: number;
  readonly maximumDepth: number;
  readonly maximumNodes: number;
  readonly maximumAttributes: number;
  readonly maximumNamespaces: number;
  readonly maximumTextBytes: number;
  readonly maximumOutputBytes: number;
  readonly deadlineMs: number;
  readonly maximumCpuSeconds: number;
  readonly maximumMemoryBytes: number;
}

export interface XmlXsdProvider {
  validate(
    request: XmlXsdValidationRequest,
    options?: { readonly signal?: AbortSignal; readonly deadlineMs?: number },
  ): Promise<XmlXsdValidationResult>;
}

export const XML_LIMITS: XmlXsdLimits = Object.freeze({
  maximumXmlBytes: 4_194_304,
  maximumSchemaBytes: 8_388_608,
  maximumSchemas: 8,
  maximumDepth: 64,
  maximumNodes: 100_000,
  maximumAttributes: 4_096,
  maximumNamespaces: 256,
  maximumTextBytes: 2_097_152,
  maximumOutputBytes: 65_536,
  deadlineMs: 5_000,
  maximumCpuSeconds: 5,
  maximumMemoryBytes: 536_870_912,
});

const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
const XML_NAME_START =
  /^(?:[\p{L}_:]|[\u{C0}-\u{D6}]|[\u{D8}-\u{F6}]|[\u{F8}-\u{2FF}]|[\u{370}-\u{37D}]|[\u{37F}-\u{1FFF}]|[\u{200C}-\u{200D}]|[\u{2070}-\u{218F}]|[\u{2C00}-\u{2FEF}]|[\u{3001}-\u{D7FF}]|[\u{F900}-\u{FDCF}]|[\u{FDF0}-\u{FFFD}]|[\u{10000}-\u{EFFFF}])$/u;
const XML_NAME_CONTINUE =
  /^(?:[\p{L}\p{N}_.:\-\u{B7}\u{0300}-\u{036F}\u{203F}-\u{2040}]|[\u{C0}-\u{D6}]|[\u{D8}-\u{F6}]|[\u{F8}-\u{2FF}]|[\u{370}-\u{37D}]|[\u{37F}-\u{1FFF}]|[\u{200C}-\u{200D}]|[\u{2070}-\u{218F}]|[\u{2C00}-\u{2FEF}]|[\u{3001}-\u{D7FF}]|[\u{F900}-\u{FDCF}]|[\u{FDF0}-\u{FFFD}]|[\u{10000}-\u{EFFFF}])$/u;

export function defineXmlDocument(input: XmlDocument): Result<XmlDocument> {
  if (!input || typeof input !== "object" || !input.root)
    return invalid("DIAG-XML-MODEL", "structure", "/xml");
  const checked = inspectElement(input.root, new Map(), 1, {
    nodes: 0,
    attributes: 0,
    namespaces: 0,
    textBytes: 0,
    serializedBytes: new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8"?>',
    ).byteLength,
  });
  if (!checked) return invalid("DIAG-XML-MODEL", "structure", "/xml");
  return ok(Object.freeze({ root: freezeElement(input.root) }));
}

export function serializeXmlDocument(input: XmlDocument): Result<Uint8Array> {
  const document = defineXmlDocument(input);
  if (document.status !== "ok") return document;
  const serialized = `<?xml version="1.0" encoding="UTF-8"?>${serializeElement(document.value.root)}`;
  const bytes = new TextEncoder().encode(serialized);
  return bytes.byteLength <= XML_LIMITS.maximumXmlBytes
    ? ok(bytes)
    : invalid("DIAG-XML-MODEL", "structure", "/xml");
}

function inspectElement(
  element: XmlElement,
  inherited: ReadonlyMap<string, string>,
  depth: number,
  counter: {
    nodes: number;
    attributes: number;
    namespaces: number;
    textBytes: number;
    serializedBytes: number;
  },
): boolean {
  if (
    element.kind !== "element" ||
    depth > XML_LIMITS.maximumDepth ||
    (counter.nodes += 1) > XML_LIMITS.maximumNodes ||
    !validNameParts(element.name)
  )
    return false;
  const elementName = qualifiedName(element.name);
  if (!addSerialized(counter, 1 + utf8Length(elementName))) return false;
  const bindings = new Map(inherited);
  const localPrefixes = new Set<string>();
  if (
    !Array.isArray(element.namespaces) ||
    (counter.namespaces += element.namespaces.length) >
      XML_LIMITS.maximumNamespaces
  )
    return false;
  for (const binding of element.namespaces) {
    if (
      !binding ||
      typeof binding.namespaceUri !== "string" ||
      !validXmlCharacters(binding.namespaceUri) ||
      (binding.prefix !== null && typeof binding.prefix !== "string")
    )
      return false;
    const prefix = binding.prefix ?? "";
    if (
      localPrefixes.has(prefix) ||
      (prefix !== "" && !validNcName(prefix)) ||
      prefix === "xmlns" ||
      binding.namespaceUri === XMLNS_NAMESPACE ||
      (prefix === "xml" && binding.namespaceUri !== XML_NAMESPACE) ||
      (prefix !== "xml" && binding.namespaceUri === XML_NAMESPACE) ||
      (prefix !== "" && binding.namespaceUri === "")
    )
      return false;
    localPrefixes.add(prefix);
    bindings.set(prefix, binding.namespaceUri);
    const declarationName = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
    if (
      !addSerialized(
        counter,
        1 +
          utf8Length(declarationName) +
          3 +
          escapedLength(binding.namespaceUri, true),
      )
    )
      return false;
  }
  bindings.set("xml", XML_NAMESPACE);
  if (!nameIsBound(element.name, bindings, false)) return false;
  if (
    !Array.isArray(element.attributes) ||
    (counter.attributes += element.attributes.length) >
      XML_LIMITS.maximumAttributes
  )
    return false;
  const attributes = new Set<string>();
  for (const attribute of element.attributes) {
    if (
      !attribute ||
      !validNameParts(attribute.name) ||
      typeof attribute.value !== "string" ||
      !validXmlCharacters(attribute.value) ||
      utf8Length(attribute.value) > XML_LIMITS.maximumTextBytes ||
      !nameIsBound(attribute.name, bindings, true)
    )
      return false;
    if (
      !addSerialized(
        counter,
        1 +
          utf8Length(qualifiedName(attribute.name)) +
          3 +
          escapedLength(attribute.value, true),
      )
    )
      return false;
    const key = `${attribute.name.namespaceUri}\u0000${attribute.name.localName}`;
    if (attributes.has(key)) return false;
    attributes.add(key);
  }
  if (!Array.isArray(element.children)) return false;
  for (const child of element.children) {
    if (!child || typeof child !== "object") return false;
    if (child.kind === "element") {
      if (!inspectElement(child, bindings, depth + 1, counter)) return false;
      continue;
    }
    counter.nodes += 1;
    if (counter.nodes > XML_LIMITS.maximumNodes) return false;
    if (child.kind === "text") {
      if (typeof child.value !== "string" || !validXmlCharacters(child.value))
        return false;
      counter.textBytes += utf8Length(child.value);
      if (!addSerialized(counter, escapedLength(child.value, false)))
        return false;
    } else if (child.kind === "comment") {
      if (
        typeof child.value !== "string" ||
        !validXmlCharacters(child.value) ||
        child.value.includes("--") ||
        child.value.endsWith("-")
      )
        return false;
      counter.textBytes += utf8Length(child.value);
      if (!addSerialized(counter, 7 + utf8Length(child.value))) return false;
    } else if (child.kind === "processing-instruction") {
      if (
        typeof child.target !== "string" ||
        !validNcName(child.target) ||
        child.target.toLowerCase() === "xml" ||
        typeof child.data !== "string" ||
        child.data.includes("?>") ||
        !validXmlCharacters(child.data)
      )
        return false;
      counter.textBytes += utf8Length(child.data);
      if (
        !addSerialized(
          counter,
          4 +
            utf8Length(child.target) +
            (child.data ? 1 + utf8Length(child.data) : 0),
        )
      )
        return false;
    } else return false;
    if (counter.textBytes > XML_LIMITS.maximumTextBytes) return false;
  }
  const closingBytes =
    element.children.length === 0 ? 2 : 1 + 3 + utf8Length(elementName);
  return addSerialized(counter, closingBytes);
}

function validNameParts(name: XmlExpandedName): boolean {
  return Boolean(
    name &&
      typeof name.namespaceUri === "string" &&
      validXmlCharacters(name.namespaceUri) &&
      validNcName(name.localName) &&
      (name.prefix === null || validNcName(name.prefix)) &&
      name.localName !== "xmlns" &&
      name.prefix !== "xmlns" &&
      name.namespaceUri !== XMLNS_NAMESPACE &&
      (name.prefix !== "xml" || name.namespaceUri === XML_NAMESPACE) &&
      (name.namespaceUri !== XML_NAMESPACE || name.prefix === "xml"),
  );
}

function nameIsBound(
  name: XmlExpandedName,
  bindings: ReadonlyMap<string, string>,
  attribute: boolean,
): boolean {
  const prefix = name.prefix ?? "";
  if (prefix !== "") return bindings.get(prefix) === name.namespaceUri;
  return name.namespaceUri === (attribute ? "" : (bindings.get("") ?? ""));
}

function validNcName(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > XML_LIMITS.maximumXmlBytes ||
    value.includes(":")
  )
    return false;
  const [first, ...rest] = [...value];
  return Boolean(
    first &&
      XML_NAME_START.test(first) &&
      rest.every((character) => XML_NAME_CONTINUE.test(character)),
  );
}

function validXmlCharacters(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (
      !(
        code === 0x9 ||
        code === 0xa ||
        code === 0xd ||
        (code >= 0x20 && code <= 0xd7ff) ||
        (code >= 0xe000 && code <= 0xfffd) ||
        (code >= 0x10000 && code <= 0x10ffff)
      )
    )
      return false;
  }
  return true;
}

function utf8Length(value: string): number {
  let bytes = 0;
  for (const character of value)
    bytes += codePointUtf8Length(character.codePointAt(0) ?? 0);
  return bytes;
}

function escapedLength(value: string, attribute: boolean): number {
  let bytes = 0;
  for (const character of value) {
    switch (character) {
      case "&":
        bytes += 5;
        break;
      case "<":
        bytes += 4;
        break;
      case ">":
        bytes += 4;
        break;
      case '"':
        bytes += attribute ? 6 : 1;
        break;
      case "\n":
        bytes += attribute ? 5 : 1;
        break;
      case "\t":
        bytes += attribute ? 5 : 1;
        break;
      case "\r":
        bytes += 5;
        break;
      default:
        bytes += codePointUtf8Length(character.codePointAt(0) ?? 0);
    }
    if (bytes > XML_LIMITS.maximumXmlBytes) return bytes;
  }
  return bytes;
}

function codePointUtf8Length(point: number): number {
  if (point <= 0x7f) return 1;
  if (point <= 0x7ff) return 2;
  if (point <= 0xffff) return 3;
  return 4;
}

function addSerialized(
  counter: { serializedBytes: number },
  bytes: number,
): boolean {
  counter.serializedBytes += bytes;
  return counter.serializedBytes <= XML_LIMITS.maximumXmlBytes;
}

function serializeElement(element: XmlElement): string {
  const namespaceText = [...element.namespaces]
    .sort((left, right) => compare(left.prefix ?? "", right.prefix ?? ""))
    .map((binding) => {
      const name =
        binding.prefix === null ? "xmlns" : `xmlns:${binding.prefix}`;
      return ` ${name}="${escapeAttribute(binding.namespaceUri)}"`;
    })
    .join("");
  const attributes = [...element.attributes]
    .sort((left, right) => {
      const namespace = compare(
        left.name.namespaceUri,
        right.name.namespaceUri,
      );
      return namespace || compare(left.name.localName, right.name.localName);
    })
    .map(
      (attribute) =>
        ` ${qualifiedName(attribute.name)}="${escapeAttribute(attribute.value)}"`,
    )
    .join("");
  const start = `<${qualifiedName(element.name)}${namespaceText}${attributes}`;
  if (element.children.length === 0) return `${start}/>`;
  const children = element.children
    .map((child) => {
      switch (child.kind) {
        case "element":
          return serializeElement(child);
        case "text":
          return escapeText(child.value);
        case "comment":
          return `<!--${child.value}-->`;
        case "processing-instruction":
          return `<?${child.target}${child.data ? ` ${child.data}` : ""}?>`;
      }
    })
    .join("");
  return `${start}>${children}</${qualifiedName(element.name)}>`;
}

function qualifiedName(name: XmlExpandedName): string {
  return name.prefix === null
    ? name.localName
    : `${name.prefix}:${name.localName}`;
}

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r", "&#xD;");
}

function escapeAttribute(value: string): string {
  return escapeText(value)
    .replaceAll('"', "&quot;")
    .replaceAll("\n", "&#xA;")
    .replaceAll("\t", "&#x9;");
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function freezeElement(element: XmlElement): XmlElement {
  return Object.freeze({
    kind: "element",
    name: Object.freeze({ ...element.name }),
    namespaces: Object.freeze(
      element.namespaces.map((binding) => Object.freeze({ ...binding })),
    ),
    attributes: Object.freeze(
      element.attributes.map((attribute) =>
        Object.freeze({
          ...attribute,
          name: Object.freeze({ ...attribute.name }),
        }),
      ),
    ),
    children: Object.freeze(
      element.children.map((child) =>
        child.kind === "element"
          ? freezeElement(child)
          : Object.freeze({ ...child }),
      ),
    ),
  });
}
