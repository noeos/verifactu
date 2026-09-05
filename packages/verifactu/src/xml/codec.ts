// SPDX-License-Identifier: Apache-2.0

import { DOMParser, type Element as DomElement } from "@xmldom/xmldom";
import { createDiagnostic, type Diagnostic } from "../diagnostics/diagnostic.js";
import { failure, success, type Result } from "../diagnostics/result.js";

/** A deliberately small, immutable XML model used at the public boundary. */
export interface XmlElement {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly XmlNode[];
}

export type XmlNode = XmlElement | string;

export interface XmlLimits {
  readonly maxBytes?: number;
  readonly maxDepth?: number;
  readonly maxNodes?: number;
  readonly maxTextBytes?: number;
}

const DEFAULT_LIMITS: Required<XmlLimits> = Object.freeze({
  maxBytes: 2 * 1024 * 1024,
  maxDepth: 64,
  maxNodes: 50_000,
  maxTextBytes: 1 * 1024 * 1024,
});

const NAME = /^[A-Za-z_][A-Za-z0-9_.:-]{0,127}$/u;

export function parseSecureXml(
  input: string | Uint8Array,
  limits: XmlLimits = {},
): Result<XmlElement> {
  const options = { ...DEFAULT_LIMITS, ...limits };
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  if (bytes.byteLength > options.maxBytes) return xmlFailure("VF_XML_LIMIT_EXCEEDED");
  let source: string;
  try {
    source =
      typeof input === "string" ? input : new TextDecoder("utf-8", { fatal: true }).decode(input);
  } catch {
    return xmlFailure("VF_XML_MALFORMED");
  }
  const diagnostics: Diagnostic[] = [];
  let nodeCount = 0;
  let textBytes = 0;
  let unsafe = /<!DOCTYPE|<!ENTITY|<!\[CDATA\[|<\?(?!xml\s)/iu.test(source);
  const parserErrors: string[] = [];
  try {
    const document = new DOMParser({
      onError: (level, message) => parserErrors.push(`${level}:${message}`),
    }).parseFromString(source, "text/xml");
    const documentElement = document.documentElement;
    if (parserErrors.length > 0 || documentElement === null) unsafe = true;
    if (!unsafe && documentElement !== null) {
      const root = fromDom(
        documentElement,
        0,
        options,
        () => {
          nodeCount += 1;
        },
        (bytes) => {
          textBytes += bytes;
        },
      );
      if (root === undefined || nodeCount > options.maxNodes || textBytes > options.maxTextBytes)
        unsafe = true;
      if (!unsafe && root !== undefined) return success(root);
    }
  } catch {
    unsafe = true;
  }
  if (unsafe) {
    diagnostics.push(
      createDiagnostic({
        code:
          nodeCount > options.maxNodes || textBytes > options.maxTextBytes
            ? "VF_XML_LIMIT_EXCEEDED"
            : /<!DOCTYPE|<!ENTITY|<!\[CDATA\[|<\?(?!xml\s)/iu.test(source)
              ? "VF_XML_UNSAFE"
              : "VF_XML_MALFORMED",
        severity: "error",
        phase: "security",
      }),
    );
    return failure("INVALID_INPUT", diagnostics);
  }
  return xmlFailure("VF_XML_MALFORMED");
}

function fromDom(
  node: DomElement,
  depth: number,
  options: Required<XmlLimits>,
  count: () => void,
  addTextBytes: (bytes: number) => void,
): XmlElement | undefined {
  if (depth >= options.maxDepth || !NAME.test(node.tagName)) return undefined;
  count();
  const attributes: Record<string, string> = {};
  for (let index = 0; index < node.attributes.length; index += 1) {
    const attribute = node.attributes.item(index);
    if (attribute === null) return undefined;
    if (!NAME.test(attribute.name)) return undefined;
    attributes[attribute.name] = attribute.value;
  }
  const children: MutableNode[] = [];
  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes.item(index);
    if (child === null) continue;
    if (child.nodeType === 3) {
      const text = child.nodeValue ?? "";
      addTextBytes(new TextEncoder().encode(text).byteLength);
      if (hasForbiddenControl(text)) return undefined;
      children.push(text);
    } else if (child.nodeType === 1) {
      // DOM nodeType 1 is an Element; xmldom's declarations expose the common Node type.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const nested = fromDom(child as DomElement, depth + 1, options, count, addTextBytes);
      if (nested === undefined) return undefined;
      children.push(nested);
    } else return undefined;
  }
  return freezeElement({ name: node.tagName, attributes, children });
}

export function serializeXml(root: XmlElement): string {
  validateElement(root);
  return `<?xml version="1.0" encoding="UTF-8"?>${serializeNode(root)}`;
}

export function canonicalizeXml(root: XmlElement): Uint8Array {
  validateElement(root);
  return new TextEncoder().encode(serializeNode(root));
}

function serializeNode(node: XmlNode): string {
  if (typeof node === "string") return escapeText(node);
  const attributes = Object.entries(node.attributes).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const attrs = attributes.map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join("");
  return `<${node.name}${attrs}>${node.children.map(serializeNode).join("")}</${node.name}>`;
}

function validateElement(element: XmlElement): void {
  if (!NAME.test(element.name)) throw new TypeError("Invalid XML element name");
  for (const [name, value] of Object.entries(element.attributes)) {
    if (!NAME.test(name) || hasForbiddenControl(value))
      throw new TypeError("Invalid XML attribute");
  }
  for (const child of element.children) {
    if (typeof child === "string") {
      if (hasForbiddenControl(child)) throw new TypeError("Invalid XML text");
    } else validateElement(child);
  }
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeText(value)
    .replaceAll('"', "&quot;")
    .replaceAll("\r", "&#xD;")
    .replaceAll("\n", "&#xA;");
}

function hasForbiddenControl(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if ((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31))
      return true;
  }
  return false;
}

function freezeElement(element: {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly XmlNode[];
}): XmlElement {
  return Object.freeze({
    name: element.name,
    attributes: Object.freeze({ ...element.attributes }),
    children: Object.freeze(
      element.children.map((child) => (typeof child === "string" ? child : freezeElement(child))),
    ),
  });
}

function xmlFailure(
  code: "VF_XML_LIMIT_EXCEEDED" | "VF_XML_UNSAFE" | "VF_XML_MALFORMED",
): Result<XmlElement> {
  return failure("INVALID_INPUT", [
    createDiagnostic({ code, severity: "error", phase: "security" }),
  ]);
}

type MutableNode = XmlElement | string;
