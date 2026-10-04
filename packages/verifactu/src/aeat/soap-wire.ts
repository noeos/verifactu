import { createHash } from "node:crypto";
import { invalid, ok, type Result } from "../contracts/results.js";
import type { FiscalContext } from "../domain/context.js";
import { createFiscalContext, sameContext } from "../domain/context.js";
import type { Identity } from "../domain/identities.js";
import { isIdentity } from "../domain/identities.js";
import { isSafeStoreToken } from "../persistence/model.js";
import type {
  AeatEditionProfile,
  AeatOperationId,
  SoapBindingProfile,
} from "./edition-profile.js";
import {
  operationProfile,
  verifyAeatEditionProfile,
} from "./edition-profile.js";

export interface CommittedRecordArtifact {
  readonly artifactId: string;
  readonly recordId: Identity<"record">;
  readonly context: FiscalContext;
  readonly editionId: Identity<"edition">;
  readonly sequence: number;
  readonly sha256: string;
  readonly bytes: Uint8Array;
}

export interface FiscalSystemHeader {
  readonly context: FiscalContext;
  readonly taxpayerId: string;
  readonly installationId: string;
  readonly productId: string;
  readonly softwareVersion: string;
  readonly installationNumber: string;
}

export interface SoapRequestArtifact {
  readonly operationId: AeatOperationId;
  readonly editionId: string;
  readonly editionDigest: string;
  readonly endpointId: string;
  readonly soapAction: string;
  readonly method: "POST";
  readonly contentType: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly bytes: Uint8Array;
  readonly orderedRecordIds: readonly string[];
  readonly recordDigests: readonly string[];
  readonly headerDigest: string;
}

const sha256 = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

function validEntityReferences(value: string): boolean {
  for (const match of value.matchAll(/&([^;]*);/gu)) {
    const entity = match[1] ?? "";
    if (!["amp", "lt", "gt", "quot", "apos"].includes(entity)) {
      if (!/^#(?:[0-9]+|x[0-9A-Fa-f]+)$/u.test(entity)) return false;
      const code =
        entity[1] === "x"
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      if (
        !(
          code === 9 ||
          code === 10 ||
          code === 13 ||
          (code >= 0x20 && code <= 0xd7ff) ||
          (code >= 0xe000 && code <= 0xfffd) ||
          (code >= 0x10000 && code <= 0x10ffff)
        )
      )
        return false;
    }
  }
  return !value
    .replace(/&(?:amp|lt|gt|quot|apos|#(?:[0-9]+|x[0-9A-Fa-f]+));/gu, "")
    .includes("&");
}

/** Validates one already-serialized record element without resolving entities or external resources. */
export function isSafeXmlElementFragment(source: string): boolean {
  if (
    typeof source !== "string" ||
    source.length === 0 ||
    source.length > 1_048_576 ||
    /<!DOCTYPE|<!ENTITY|<\?|<!--|<!\[CDATA\[/iu.test(source) ||
    source.includes("]]>")
  )
    return false;
  const stack: string[] = [];
  let roots = 0;
  for (let index = 0; index < source.length; ) {
    if (source[index] !== "<") {
      const end = source.indexOf("<", index);
      const text = source.slice(index, end < 0 ? source.length : end);
      if (stack.length === 0 && text.trim() !== "") return false;
      if (!validEntityReferences(text)) return false;
      index = end < 0 ? source.length : end;
      continue;
    }
    let end = index + 1;
    let quote = "";
    for (; end < source.length; end += 1) {
      const character = source[end];
      if (quote) {
        if (character === quote) quote = "";
      } else if (character === "'" || character === '"') quote = character;
      else if (character === ">") break;
      else if (character === "<") return false;
    }
    if (end >= source.length || quote) return false;
    const markup = source.slice(index + 1, end);
    const closing = markup.startsWith("/");
    const selfClosing = markup.endsWith("/");
    const body = closing
      ? markup.slice(1).trim()
      : selfClosing
        ? markup.slice(0, -1).trim()
        : markup.trim();
    const match = body.match(
      /^([A-Za-z_][A-Za-z0-9_.-]*:[A-Za-z_][A-Za-z0-9_.-]*|[A-Za-z_][A-Za-z0-9_.-]*)(?:\s|$)/u,
    );
    if (!match) return false;
    const name = match[1];
    if (!name) return false;
    if (closing) {
      if (body.slice(name.length).trim() !== "" || stack.pop() !== name)
        return false;
    } else {
      const attrs = body.slice(name.length);
      const attributes = new Set<string>();
      const attrPattern =
        /\s+([A-Za-z_][A-Za-z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/guy;
      let offset = 0;
      while (offset < attrs.length) {
        attrPattern.lastIndex = offset;
        const attr = attrPattern.exec(attrs);
        if (!attr) return false;
        const attributeName = attr[1];
        if (!attributeName || attributes.has(attributeName)) return false;
        attributes.add(attributeName);
        if (!validEntityReferences(attr[2] ?? attr[3] ?? "")) return false;
        offset = attrPattern.lastIndex;
      }
      if (stack.length === 0) roots += 1;
      if (!selfClosing) stack.push(name);
    }
    index = end + 1;
  }
  return roots === 1 && stack.length === 0;
}

function renderHeader(
  binding: SoapBindingProfile,
  header: FiscalSystemHeader,
): Result<string> {
  if (
    !header ||
    createFiscalContext(header.context).status !== "ok" ||
    header.taxpayerId !== header.context.taxpayerId.value ||
    header.installationId !== header.context.installationId.value ||
    !isSafeStoreToken(header.productId) ||
    !isSafeStoreToken(header.softwareVersion) ||
    !isSafeStoreToken(header.installationNumber)
  )
    return invalid("DIAG-AEAT-HEADER-IDENTITY", "domain");
  const prefix = binding.headerQName.split(":", 1)[0];
  const values: Readonly<
    Record<SoapBindingProfile["headerFields"][number]["valueKind"], string>
  > = {
    taxpayer: header.taxpayerId,
    installation: header.installationId,
    product: header.productId,
    "software-version": header.softwareVersion,
    "installation-number": header.installationNumber,
  };
  const children = binding.headerFields
    .map(
      (field) =>
        `<${prefix}:${field.name}>${escapeXml(values[field.valueKind])}</${prefix}:${field.name}>`,
    )
    .join("");
  return ok(`<${binding.headerQName}>${children}</${binding.headerQName}>`);
}

export function buildSoapRequest(input: {
  readonly profile: AeatEditionProfile;
  readonly operationId: AeatOperationId;
  readonly endpointId: string;
  readonly header: FiscalSystemHeader;
  readonly records: readonly CommittedRecordArtifact[];
  readonly namespaces?: Readonly<Record<string, string>>;
}): Result<SoapRequestArtifact> {
  const operation = input?.profile
    ? operationProfile(input.profile, input.operationId)
    : null;
  if (
    !input ||
    !operation ||
    !verifyAeatEditionProfile(input.profile) ||
    !isSafeStoreToken(input.endpointId) ||
    !input.profile.digest ||
    !input.header ||
    !Array.isArray(input.records) ||
    input.records.length === 0 ||
    input.records.length > operation.binding.maxBatchItems
  )
    return invalid("DIAG-AEAT-REQUEST-INVALID", "domain");
  if (input.profile.lifecycle !== "active" || !input.profile.creationAllowed)
    return invalid("DIAG-AEAT-EDITION-INACTIVE", "edition");
  const endpoint = operation.endpoints.find(
    (item) => item.id === input.endpointId,
  );
  if (!endpoint) return invalid("DIAG-AEAT-ENDPOINT-UNAVAILABLE", "edition");
  const context = input.header.context;
  if (
    createFiscalContext(context).status !== "ok" ||
    context.editionId.value !== input.profile.editionId
  )
    return invalid("DIAG-AEAT-CONTEXT-MISMATCH", "domain");
  const ordered = [...input.records];
  for (let index = 0; index < ordered.length; index += 1) {
    const item = ordered[index];
    if (
      !item ||
      !isIdentity(item.recordId, "record") ||
      !isIdentity(item.editionId, "edition") ||
      !sameContext(item.context, context) ||
      item.editionId.value !== input.profile.editionId ||
      !isSafeStoreToken(item.artifactId) ||
      !Number.isSafeInteger(item.sequence) ||
      item.sequence < 1 ||
      !(item.bytes instanceof Uint8Array) ||
      item.bytes.length === 0 ||
      item.bytes.length > operation.binding.maxRequestBytes ||
      sha256(item.bytes) !== item.sha256 ||
      (index > 0 && ordered[index - 1]!.sequence >= item.sequence)
    )
      return invalid(
        "DIAG-AEAT-RECORD-ARTIFACT",
        "domain",
        `/records/${index}`,
      );
    let xml: string;
    try {
      xml = new TextDecoder("utf-8", { fatal: true }).decode(item.bytes);
    } catch {
      return invalid("DIAG-AEAT-RECORD-UTF8", "utf8", `/records/${index}`);
    }
    if (!isSafeXmlElementFragment(xml))
      return invalid("DIAG-AEAT-RECORD-XML", "structure", `/records/${index}`);
  }
  const renderedHeader = renderHeader(operation.binding, input.header);
  if (renderedHeader.status !== "ok") return renderedHeader;
  const namespaces = new Map(
    operation.binding.namespaceBindings.map((entry) => [
      entry.prefix,
      entry.namespace,
    ]),
  );
  if (input.namespaces) {
    for (const [prefix, uri] of Object.entries(input.namespaces)) {
      if (namespaces.get(prefix) !== uri)
        return invalid("DIAG-AEAT-NAMESPACE-OVERRIDE", "edition");
    }
  }
  const headerPrefix = operation.binding.headerQName.split(":", 1)[0]!;
  const declarations = [
    `xmlns:soapenv="${escapeXml(operation.binding.envelopeNamespace)}"`,
    ...[...namespaces].map(
      ([prefix, uri]) => `xmlns:${prefix}="${escapeXml(uri)}"`,
    ),
  ].join(" ");
  const header = renderedHeader.value.replace(
    `<${operation.binding.headerQName}>`,
    `<${operation.binding.headerQName} xmlns:${headerPrefix}="${escapeXml(namespaces.get(headerPrefix) ?? "")}">`,
  );
  const content = `<soapenv:Envelope ${declarations}><soapenv:Header>${header}</soapenv:Header><soapenv:Body><${operation.binding.requestQName}>${ordered.map((item) => new TextDecoder("utf-8", { fatal: true }).decode(item.bytes)).join("")}</${operation.binding.requestQName}></soapenv:Body></soapenv:Envelope>`;
  const bytes = new TextEncoder().encode(content);
  if (bytes.byteLength > operation.binding.maxRequestBytes)
    return invalid("DIAG-AEAT-REQUEST-LIMIT", "bytes");
  const headerDigest = sha256(new TextEncoder().encode(renderedHeader.value));
  return ok(
    Object.freeze({
      operationId: input.operationId,
      editionId: input.profile.editionId,
      editionDigest: input.profile.digest,
      endpointId: endpoint.id,
      soapAction: operation.binding.soapAction,
      method: "POST",
      contentType: operation.binding.contentType,
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
      bytes,
      orderedRecordIds: Object.freeze(
        ordered.map((item) => item.recordId.value),
      ),
      recordDigests: Object.freeze(ordered.map((item) => item.sha256)),
      headerDigest,
    }),
  );
}
