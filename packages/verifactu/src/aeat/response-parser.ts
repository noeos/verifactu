import { createHash } from "node:crypto";
import { invalid } from "../contracts/results.js";
import type { Result } from "../contracts/results.js";
import type {
  AeatEditionProfile,
  AeatOperationId,
  AeatResponseContract,
} from "./edition-profile.js";
import {
  operationProfile,
  verifyAeatEditionProfile,
} from "./edition-profile.js";

interface XmlNode {
  readonly qname: string;
  readonly namespace: string;
  readonly local: string;
  readonly text: string;
  readonly children: readonly XmlNode[];
}

export interface ParsedAeatLine {
  readonly identity: readonly string[];
  readonly wireStatus: string | null;
  readonly classification:
    | "accepted"
    | "accepted-with-errors"
    | "rejected"
    | "unrecognized";
  readonly errorCode: string | null;
}

export interface ParsedAeatResponse {
  readonly status:
    | "accepted"
    | "accepted-with-errors"
    | "rejected"
    | "unrecognized"
    | "soap-fault"
    | "http-error"
    | "malformed";
  readonly globalStatus: string | null;
  readonly lines: readonly ParsedAeatLine[];
  readonly waitInstruction: string | null;
  readonly responseArtifact: Uint8Array;
  readonly responseDigest: string;
  readonly diagnostics: readonly string[];
}

const xmlChar = (value: number): boolean =>
  value === 0x9 ||
  value === 0xa ||
  value === 0xd ||
  (value >= 0x20 && value <= 0xd7ff) ||
  (value >= 0xe000 && value <= 0xfffd) ||
  (value >= 0x10000 && value <= 0x10ffff);

function decodeEntities(value: string): string | null {
  if (
    value
      .replace(/&(?:amp|lt|gt|quot|apos|#(?:\d+|x[0-9A-Fa-f]+));/gu, "")
      .includes("&")
  )
    return null;
  let valid = true;
  const decoded = value.replace(/&([^;]+);/gu, (_all, entity: string) => {
    if (entity === "amp") return "&";
    if (entity === "lt") return "<";
    if (entity === "gt") return ">";
    if (entity === "quot") return '"';
    if (entity === "apos") return "'";
    if (/^#\d+$/u.test(entity) || /^#x[0-9A-Fa-f]+$/u.test(entity)) {
      const code =
        entity[1] === "x"
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      if (xmlChar(code)) return String.fromCodePoint(code);
    }
    valid = false;
    return "";
  });
  if (!valid) return null;
  return decoded;
}

function parseStartTag(source: string): {
  name: string;
  attributes: Map<string, string>;
  selfClosing: boolean;
} | null {
  const selfClosing = source.endsWith("/");
  const body = (selfClosing ? source.slice(0, -1) : source).trimEnd();
  const nameMatch = body.match(/^([A-Za-z_][A-Za-z0-9_.:-]*)/u);
  if (!nameMatch?.[1]) return null;
  const name = nameMatch[1];
  const attributes = new Map<string, string>();
  const attrPattern =
    /\s+([A-Za-z_][A-Za-z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/guy;
  let offset = name.length;
  while (offset < body.length) {
    attrPattern.lastIndex = offset;
    const match = attrPattern.exec(body);
    const attributeName = match?.[1];
    if (!match || !attributeName || attributes.has(attributeName)) return null;
    const value = decodeEntities(match[2] ?? match[3] ?? "");
    if (value === null) return null;
    attributes.set(attributeName, value);
    offset = attrPattern.lastIndex;
  }
  return { name, attributes, selfClosing };
}

function resolveName(
  name: string,
  namespaces: ReadonlyMap<string, string>,
  attribute = false,
): { namespace: string; local: string } | null {
  const parts = name.split(":");
  if (
    parts.length > 2 ||
    parts.some((part) => !/^[A-Za-z_][A-Za-z0-9_.-]*$/u.test(part))
  )
    return null;
  if (parts.length === 1)
    return {
      namespace: attribute ? "" : (namespaces.get("") ?? ""),
      local: name,
    };
  const prefix = parts[0];
  const local = parts[1];
  if (!prefix || !local) return null;
  const namespace = namespaces.get(prefix);
  return namespace ? { namespace, local } : null;
}

function expectedName(
  name: string,
  namespaces: readonly {
    readonly prefix: string;
    readonly namespace: string;
  }[],
): { namespace: string; local: string } | null {
  const parts = name.split(":");
  if (parts.length !== 2) return null;
  const prefix = parts[0];
  const local = parts[1];
  if (!prefix || !local) return null;
  const namespace = namespaces.find(
    (item) => item.prefix === prefix,
  )?.namespace;
  return namespace ? { namespace, local } : null;
}

function matchesQName(
  node: XmlNode,
  name: string,
  namespaces: readonly {
    readonly prefix: string;
    readonly namespace: string;
  }[],
): boolean {
  const expected = expectedName(name, namespaces);
  return (
    !!expected &&
    node.namespace === expected.namespace &&
    node.local === expected.local
  );
}

function parseXml(bytes: Uint8Array, maximumBytes: number): XmlNode | null {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength === 0 ||
    bytes.byteLength > maximumBytes
  )
    return null;
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  if (
    source.charCodeAt(0) === 0xfeff ||
    /<!DOCTYPE|<!ENTITY|<!--|<!\[CDATA\[/iu.test(source)
  )
    return null;
  if ([...source].some((character) => !xmlChar(character.codePointAt(0) ?? -1)))
    return null;
  if (source.startsWith("<?xml")) {
    const declarationEnd = source.indexOf("?>");
    if (
      declarationEnd < 0 ||
      !/^<\?xml\s+version\s*=\s*(['"])1\.0\1(?:\s+encoding\s*=\s*(['"])UTF-8\2)?(?:\s+standalone\s*=\s*(['"])(?:yes|no)\3)?\s*\?>$/u.test(
        source.slice(0, declarationEnd + 2),
      )
    )
      return null;
    source = source.slice(declarationEnd + 2);
  }
  if (source.includes("<?") || source.includes("<!")) return null;
  type MutableNode = {
    qname: string;
    namespace: string;
    local: string;
    text: string;
    children: MutableNode[];
    namespaces: Map<string, string>;
  };
  const roots: MutableNode[] = [];
  const stack: MutableNode[] = [];
  let nodes = 0;
  for (let index = 0; index < source.length; ) {
    if (source[index] !== "<") {
      const end = source.indexOf("<", index);
      const rawText = source.slice(index, end < 0 ? source.length : end);
      const text = decodeEntities(rawText);
      if (text === null || (stack.length === 0 && text.trim() !== ""))
        return null;
      if (stack.length > 0) stack.at(-1)!.text += text;
      index = end < 0 ? source.length : end;
      continue;
    }
    let end = index + 1;
    let quote = "";
    for (; end < source.length; end += 1) {
      const ch = source[end];
      if (quote) {
        if (ch === quote) quote = "";
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === ">") break;
      else if (ch === "<") return null;
    }
    if (end >= source.length || quote) return null;
    const markup = source.slice(index + 1, end);
    if (markup.startsWith("/")) {
      const name = markup.slice(1).trim();
      if (
        !/^[A-Za-z_][A-Za-z0-9_.:-]*$/u.test(name) ||
        stack.at(-1)?.qname !== name
      )
        return null;
      stack.pop();
    } else {
      const parsed = parseStartTag(markup);
      if (!parsed || ++nodes > 100_000 || stack.length >= 64) return null;
      const namespaces = new Map(
        stack.at(-1)?.namespaces ?? [
          ["xml", "http://www.w3.org/XML/1998/namespace"],
        ],
      );
      for (const [key, value] of parsed.attributes) {
        if (key === "xmlns") namespaces.set("", value);
        else if (key.startsWith("xmlns:")) namespaces.set(key.slice(6), value);
      }
      const resolved = resolveName(parsed.name, namespaces);
      if (!resolved) return null;
      const node: MutableNode = {
        qname: parsed.name,
        namespace: resolved.namespace,
        local: resolved.local,
        text: "",
        children: [],
        namespaces,
      };
      for (const [key] of parsed.attributes) {
        if (key === "xmlns" || key.startsWith("xmlns:")) continue;
        if (!resolveName(key, namespaces, true)) return null;
      }
      if (stack.length > 0) stack.at(-1)!.children.push(node);
      else roots.push(node);
      if (!parsed.selfClosing) stack.push(node);
    }
    index = end + 1;
  }
  if (stack.length !== 0 || roots.length !== 1) return null;
  const freeze = (node: MutableNode): XmlNode =>
    Object.freeze({
      qname: node.qname,
      namespace: node.namespace,
      local: node.local,
      text: node.text,
      children: Object.freeze(node.children.map(freeze)),
    });
  const root = roots[0];
  return root ? freeze(root) : null;
}

function findPath(
  node: XmlNode,
  path: string,
  namespaces: readonly {
    readonly prefix: string;
    readonly namespace: string;
  }[],
): XmlNode | null {
  let current: XmlNode | null = node;
  for (const qname of path.split("/")) {
    const matches: readonly XmlNode[] =
      current?.children.filter((child) =>
        matchesQName(child, qname, namespaces),
      ) ?? [];
    if (matches.length !== 1) return null;
    current = matches[0] ?? null;
    if (!current) return null;
  }
  return current;
}

function classify(
  value: string | null,
  accepted: readonly string[],
  qualified: readonly string[],
  rejected: readonly string[],
): ParsedAeatLine["classification"] {
  if (value === null) return "unrecognized";
  if (accepted.includes(value)) return "accepted";
  if (qualified.includes(value)) return "accepted-with-errors";
  if (rejected.includes(value)) return "rejected";
  return "unrecognized";
}

function globalClassify(
  value: string | null,
  contract: AeatResponseContract,
): ParsedAeatResponse["status"] {
  if (value === null) return "unrecognized";
  if (contract.acceptedGlobalValues.includes(value)) return "accepted";
  if (contract.partialGlobalValues.includes(value))
    return "accepted-with-errors";
  if (contract.rejectedGlobalValues.includes(value)) return "rejected";
  return "unrecognized";
}

export function parseAeatResponse(input: {
  readonly profile: AeatEditionProfile;
  readonly operationId: AeatOperationId;
  readonly httpStatus: number;
  readonly responseBytes: Uint8Array;
}): Result<ParsedAeatResponse> {
  const operation = input?.profile
    ? operationProfile(input.profile, input.operationId)
    : null;
  if (
    !input ||
    !operation ||
    !verifyAeatEditionProfile(input.profile) ||
    !Number.isInteger(input.httpStatus) ||
    input.httpStatus < 100 ||
    input.httpStatus > 599 ||
    !(input.responseBytes instanceof Uint8Array)
  )
    return invalid("DIAG-AEAT-RESPONSE-INPUT", "domain");
  const bytes = input.responseBytes.slice();
  const responseDigest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
  const malformed = (code: string): Result<ParsedAeatResponse> => ({
    status: "ok",
    value: Object.freeze({
      status: "malformed",
      globalStatus: null,
      lines: Object.freeze([]),
      waitInstruction: null,
      responseArtifact: bytes,
      responseDigest,
      diagnostics: Object.freeze([code]),
    }),
  });
  if (bytes.byteLength > operation.binding.maxResponseBytes)
    return malformed("DIAG-AEAT-RESPONSE-OVERSIZED");
  const root = parseXml(bytes, operation.binding.maxResponseBytes);
  if (!root) return malformed("DIAG-AEAT-RESPONSE-XML");
  const envelope = operation.binding.envelopeNamespace;
  const body = root.children.filter(
    (child) => child.namespace === envelope && child.local === "Body",
  );
  if (
    root.namespace !== envelope ||
    root.local !== "Envelope" ||
    body.length !== 1 ||
    body[0]?.children.length !== 1
  )
    return malformed("DIAG-AEAT-SOAP-ENVELOPE");
  const payload = body[0].children[0];
  if (!payload) return malformed("DIAG-AEAT-SOAP-ENVELOPE");
  const contract = operation.response;
  if (
    matchesQName(
      payload,
      contract.soapFaultQName,
      operation.binding.namespaceBindings,
    )
  )
    return {
      status: "ok",
      value: Object.freeze({
        status: "soap-fault",
        globalStatus: null,
        lines: Object.freeze([]),
        waitInstruction: null,
        responseArtifact: bytes,
        responseDigest,
        diagnostics: Object.freeze(["DIAG-AEAT-SOAP-FAULT"]),
      }),
    };
  if (
    !matchesQName(
      payload,
      contract.responseQName,
      operation.binding.namespaceBindings,
    )
  )
    return malformed("DIAG-AEAT-RESPONSE-QNAME");
  let unknownFields = payload.children.some(
    (child) =>
      !contract.allowedResponseChildren.some((name) =>
        matchesQName(child, name, operation.binding.namespaceBindings),
      ),
  );
  const globalStatusMatches = contract.globalStatusQName
    ? payload.children.filter((child) =>
        matchesQName(
          child,
          contract.globalStatusQName!,
          operation.binding.namespaceBindings,
        ),
      )
    : [];
  if (globalStatusMatches.length > 1)
    return malformed("DIAG-AEAT-RESPONSE-DUPLICATE-FIELD");
  const globalStatusNode = globalStatusMatches[0];
  const globalStatus = globalStatusNode?.text.trim() || null;
  let waitInstruction: string | null = null;
  if (contract.waitTimeQName) {
    const waitMatches = payload.children.filter((child) =>
      matchesQName(
        child,
        contract.waitTimeQName!,
        operation.binding.namespaceBindings,
      ),
    );
    if (waitMatches.length !== 1) return malformed("DIAG-AEAT-WAIT-MISSING");
    const waitNode = waitMatches[0];
    if (!waitNode) return malformed("DIAG-AEAT-WAIT-MISSING");
    const wait = waitNode.text.trim();
    if (!/^\d{1,4}$/u.test(wait)) return malformed("DIAG-AEAT-WAIT-INVALID");
    waitInstruction = wait;
  }
  const lines: ParsedAeatLine[] = [];
  if (contract.lineQName)
    for (const node of payload.children.filter((child) =>
      matchesQName(
        child,
        contract.lineQName!,
        operation.binding.namespaceBindings,
      ),
    )) {
      if (lines.length >= 500) return malformed("DIAG-AEAT-LINE-LIMIT");
      if (
        node.children.some(
          (child) =>
            !contract.allowedLineChildren.some((name) =>
              matchesQName(child, name, operation.binding.namespaceBindings),
            ),
        )
      )
        unknownFields = true;
      const identity: string[] = [];
      for (const path of contract.lineIdentityPaths) {
        const field = findPath(node, path, operation.binding.namespaceBindings);
        const value = field?.text.trim() ?? "";
        if (
          !field ||
          value.length === 0 ||
          value.length > 256 ||
          /[\u0000-\u001f\u007f]/u.test(value)
        )
          return malformed("DIAG-AEAT-CORRELATION-IDENTITY");
        identity.push(value);
      }
      if (new Set(identity).size !== identity.length)
        return malformed("DIAG-AEAT-CORRELATION-AMBIGUOUS");
      const statusMatches = contract.lineStatusQName
        ? node.children.filter((child) =>
            matchesQName(
              child,
              contract.lineStatusQName!,
              operation.binding.namespaceBindings,
            ),
          )
        : [];
      const codeMatches = contract.lineErrorCodeQName
        ? node.children.filter((child) =>
            matchesQName(
              child,
              contract.lineErrorCodeQName!,
              operation.binding.namespaceBindings,
            ),
          )
        : [];
      if (statusMatches.length > 1 || codeMatches.length > 1)
        return malformed("DIAG-AEAT-RESPONSE-DUPLICATE-FIELD");
      const wireStatus = statusMatches[0]?.text.trim() ?? null;
      const errorCode = codeMatches[0]?.text.trim() ?? null;
      if (errorCode !== null && !/^\d{1,9}$/u.test(errorCode))
        return malformed("DIAG-AEAT-ERROR-CODE");
      lines.push(
        Object.freeze({
          identity: Object.freeze(identity),
          wireStatus,
          classification: classify(
            wireStatus,
            contract.acceptedLineValues,
            contract.qualifiedLineValues,
            contract.rejectedLineValues,
          ),
          errorCode,
        }),
      );
    }
  let classification = globalClassify(globalStatus, contract);
  if (lines.some((line) => line.classification === "unrecognized"))
    classification = "unrecognized";
  const status =
    input.httpStatus < 200 || input.httpStatus >= 300
      ? "http-error"
      : unknownFields
        ? "unrecognized"
        : classification;
  return {
    status: "ok",
    value: Object.freeze({
      status,
      globalStatus,
      lines: Object.freeze(lines),
      waitInstruction,
      responseArtifact: bytes,
      responseDigest,
      diagnostics: Object.freeze(
        status === "unrecognized"
          ? ["DIAG-AEAT-RESPONSE-UNKNOWN"]
          : status === "http-error"
            ? ["DIAG-AEAT-HTTP-STATUS"]
            : [],
      ),
    }),
  };
}
