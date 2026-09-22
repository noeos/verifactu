import {
  failed,
  succeeded,
  type OperationResult,
} from "../contracts/results.js";
import { diagnostic } from "../domain/diagnostics.js";

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

export interface XmlElement {
  readonly kind: "element";
  readonly name: XmlExpandedName;
  readonly namespaces: readonly XmlNamespaceBinding[];
  readonly attributes: readonly XmlAttribute[];
  readonly children: readonly XmlNode[];
}

export type XmlNode = XmlElement | XmlText | XmlComment;

export interface XmlDocument {
  readonly root: XmlElement;
}

export type XsdValidationStatus =
  | "valid"
  | "invalid"
  | "unavailable"
  | "limit"
  | "cancelled"
  | "defect";

export type SemanticValidationStatus = "valid" | "invalid" | "not-evaluated";

export interface XmlSchemaResource {
  readonly id: string;
  readonly bytes: Uint8Array;
  readonly sha256: string;
  readonly aliases?: readonly string[];
}

export interface XmlXsdValidationRequest {
  readonly xml: Uint8Array;
  readonly rootSchemaId: string;
  readonly schemas: readonly XmlSchemaResource[];
  readonly semanticStatus: SemanticValidationStatus;
}

export interface XmlXsdValidationResult {
  readonly status: XsdValidationStatus;
  readonly xsd: "valid" | "invalid" | "not-evaluated";
  readonly semantic: SemanticValidationStatus;
  readonly diagnostics: readonly string[];
}

export interface XmlXsdProvider {
  validate(
    request: XmlXsdValidationRequest,
    options?: { readonly signal?: AbortSignal; readonly deadlineMs?: number },
  ): Promise<XmlXsdValidationResult>;
}

const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
const NAME = /^[\p{L}_][\p{L}\p{N}_.-]*$/u;

export function defineXmlDocument(
  input: XmlDocument,
): OperationResult<XmlDocument> {
  try {
    validateElement(input.root, new Map(), "/root");
    return succeeded(freezeDocument(input));
  } catch (error) {
    return failed("invalid", [
      diagnostic("DIAG-XML-MODEL", "input", "structure", "/xml", {
        reason: error instanceof Error ? error.message : "invalid",
      }),
    ]);
  }
}

export function serializeXmlDocument(
  input: XmlDocument,
): OperationResult<Uint8Array> {
  const document = defineXmlDocument(input);
  if (document.status !== "succeeded") return document;
  const text = `<?xml version="1.0" encoding="UTF-8"?>${serializeElement(document.value.root)}`;
  return succeeded(new globalThis.TextEncoder().encode(text));
}

function validateElement(
  element: XmlElement,
  inherited: ReadonlyMap<string, string>,
  path: string,
): void {
  if (element.kind !== "element") throw new Error(`${path}:kind`);
  const bindings = new Map(inherited);
  const localPrefixes = new Set<string>();
  for (const [index, binding] of element.namespaces.entries()) {
    const prefix = binding.prefix ?? "";
    if (localPrefixes.has(prefix))
      throw new Error(`${path}:namespace-duplicate`);
    localPrefixes.add(prefix);
    if (prefix.length > 0 && !NAME.test(prefix))
      throw new Error(`${path}:namespace-prefix-${index}`);
    if (prefix === "xmlns" || binding.namespaceUri === XMLNS_NAMESPACE)
      throw new Error(`${path}:namespace-reserved`);
    if (
      (prefix === "xml" && binding.namespaceUri !== XML_NAMESPACE) ||
      (prefix !== "xml" && binding.namespaceUri === XML_NAMESPACE)
    )
      throw new Error(`${path}:namespace-xml`);
    bindings.set(prefix, binding.namespaceUri);
  }
  bindings.set("xml", XML_NAMESPACE);
  validateName(element.name, bindings, false, `${path}/name`);
  const attributes = new Set<string>();
  for (const [index, attribute] of element.attributes.entries()) {
    validateName(attribute.name, bindings, true, `${path}/@${index}`);
    validateCharacters(attribute.value, `${path}/@${index}`);
    const expanded = `{${attribute.name.namespaceUri}}${attribute.name.localName}`;
    if (attributes.has(expanded))
      throw new Error(`${path}:attribute-duplicate`);
    attributes.add(expanded);
  }
  for (const [index, child] of element.children.entries()) {
    if (child.kind === "element")
      validateElement(child, bindings, `${path}/${index}`);
    else {
      validateCharacters(child.value, `${path}/${index}`);
      if (
        child.kind === "comment" &&
        (child.value.includes("--") || child.value.endsWith("-"))
      )
        throw new Error(`${path}:comment`);
    }
  }
}

function validateName(
  name: XmlExpandedName,
  bindings: ReadonlyMap<string, string>,
  attribute: boolean,
  path: string,
): void {
  if (!NAME.test(name.localName) || name.localName.includes(":"))
    throw new Error(`${path}:local-name`);
  const prefix = name.prefix ?? "";
  if (prefix.length > 0 && (!NAME.test(prefix) || prefix.includes(":")))
    throw new Error(`${path}:prefix`);
  if (prefix === "xmlns" || name.namespaceUri === XMLNS_NAMESPACE)
    throw new Error(`${path}:reserved`);
  if (prefix === "xml" && name.namespaceUri !== XML_NAMESPACE)
    throw new Error(`${path}:xml-prefix`);
  if (prefix.length > 0 && bindings.get(prefix) !== name.namespaceUri)
    throw new Error(`${path}:unbound-prefix`);
  if (prefix.length === 0) {
    const expected = attribute ? "" : (bindings.get("") ?? "");
    if (name.namespaceUri !== expected)
      throw new Error(`${path}:default-namespace`);
  }
}

function validateCharacters(value: string, path: string): void {
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    if (
      point !== 0x9 &&
      point !== 0xa &&
      point !== 0xd &&
      (point < 0x20 ||
        (point >= 0xd800 && point <= 0xdfff) ||
        point === 0xfffe ||
        point === 0xffff)
    )
      throw new Error(`${path}:character`);
  }
}

function serializeElement(element: XmlElement): string {
  const qualified = qname(element.name);
  const namespaces = [...element.namespaces]
    .sort((left, right) =>
      (left.prefix ?? "").localeCompare(right.prefix ?? "", "en"),
    )
    .map((binding) => {
      const name =
        binding.prefix === null ? "xmlns" : `xmlns:${binding.prefix}`;
      return ` ${name}="${escapeAttribute(binding.namespaceUri)}"`;
    })
    .join("");
  const attributes = [...element.attributes]
    .sort((left, right) => {
      const leftKey = `{${left.name.namespaceUri}}${left.name.localName}`;
      const rightKey = `{${right.name.namespaceUri}}${right.name.localName}`;
      return leftKey.localeCompare(rightKey, "en");
    })
    .map(
      (attribute) =>
        ` ${qname(attribute.name)}="${escapeAttribute(attribute.value)}"`,
    )
    .join("");
  if (element.children.length === 0)
    return `<${qualified}${namespaces}${attributes}/>`;
  return `<${qualified}${namespaces}${attributes}>${element.children
    .map((child) =>
      child.kind === "element"
        ? serializeElement(child)
        : child.kind === "comment"
          ? `<!--${child.value}-->`
          : escapeText(child.value),
    )
    .join("")}</${qualified}>`;
}

function qname(name: XmlExpandedName): string {
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

function freezeDocument(document: XmlDocument): XmlDocument {
  const freezeName = (name: XmlExpandedName): XmlExpandedName =>
    Object.freeze({ ...name });
  const freezeNode = (node: XmlNode): XmlNode => {
    if (node.kind !== "element") return Object.freeze({ ...node });
    return Object.freeze({
      ...node,
      name: freezeName(node.name),
      namespaces: Object.freeze(
        node.namespaces.map((binding) => Object.freeze({ ...binding })),
      ),
      attributes: Object.freeze(
        node.attributes.map((attribute) =>
          Object.freeze({ ...attribute, name: freezeName(attribute.name) }),
        ),
      ),
      children: Object.freeze(node.children.map(freezeNode)),
    });
  };
  return Object.freeze({ root: freezeNode(document.root) as XmlElement });
}
