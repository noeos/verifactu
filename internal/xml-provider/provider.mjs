import { createHash, timingSafeEqual } from "node:crypto";
import { runXmlWorker } from "./worker.mjs";

export const DEFAULT_XML_LIMITS = Object.freeze({
  maximumXmlBytes: 4_194_304,
  maximumSchemaBytes: 8_388_608,
  maximumSchemas: 32,
  maximumDepth: 64,
  maximumNodes: 100_000,
  maximumAttributes: 4_096,
  maximumNamespaces: 256,
  maximumTextBytes: 2_097_152,
  maximumOutputBytes: 65_536,
  deadlineMs: 5_000,
  maximumCpuSeconds: 5,
});

const FORBIDDEN_MARKUP =
  /<!\s*(?:DOCTYPE|ENTITY)\b|http:\/\/www\.w3\.org\/2001\/XInclude/iu;
const PINNED_XMLDSIG_SHA256 =
  "d102ad3df7664c307e0c2c776ba4a90513b1969974d8a940bae1a77f9f21e15d";

export function validateXmlXsd(request, options = {}) {
  const semantic = request?.semanticStatus ?? "not-evaluated";
  if (options.signal?.aborted === true)
    return outcome("cancelled", "not-evaluated", semantic, [
      "DIAG-XML-CANCELLED",
    ]);
  try {
    const limits = normalizeLimits(options.limits);
    const deadlineMs = options.deadlineMs ?? limits.deadlineMs;
    if (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0)
      return outcome("limit", "not-evaluated", semantic, ["DIAG-XML-DEADLINE"]);
    if (!validRequest(request))
      return outcome("defect", "not-evaluated", semantic, ["DIAG-XSD-REQUEST"]);
    if (request.xml.byteLength > limits.maximumXmlBytes)
      return outcome("limit", "not-evaluated", semantic, ["DIAG-XML-BYTES"]);
    const totalSchemaBytes = request.schemas.reduce(
      (total, schema) => total + schema.bytes.byteLength,
      0,
    );
    if (
      request.schemas.length > limits.maximumSchemas ||
      totalSchemaBytes > limits.maximumSchemaBytes
    )
      return outcome("limit", "not-evaluated", semantic, [
        "DIAG-XSD-RESOURCES",
      ]);
    const xml = strictUtf8(request.xml);
    if (FORBIDDEN_MARKUP.test(xml))
      return outcome("invalid", "invalid", semantic, [
        "DIAG-XML-FORBIDDEN-MARKUP",
      ]);
    const scan = scanXmlResources(xml, limits);
    if (scan !== null)
      return scan === "DIAG-XML-SYNTAX"
        ? outcome("invalid", "invalid", semantic, [scan])
        : outcome("limit", "not-evaluated", semantic, [scan]);
    const aliases = new Set();
    const schemas = [];
    for (const schema of request.schemas) {
      if (!digestMatches(schema.bytes, schema.sha256))
        return outcome("defect", "not-evaluated", semantic, [
          "DIAG-XSD-DIGEST",
        ]);
      const text = normalizeSchemaText(
        schema.id,
        schema.sha256,
        strictUtf8(schema.bytes),
      );
      if (/<!\s*(?:DOCTYPE|ENTITY)\b/iu.test(text))
        return outcome("defect", "not-evaluated", semantic, [
          "DIAG-XSD-FORBIDDEN-MARKUP",
        ]);
      const resourceAliases = [schema.id, ...(schema.aliases ?? [])];
      if (
        resourceAliases.some(
          (alias) =>
            alias.length === 0 ||
            aliases.has(alias) ||
            alias.startsWith("file:"),
        )
      )
        return outcome("defect", "not-evaluated", semantic, [
          "DIAG-XSD-RESOURCE-MAP",
        ]);
      for (const alias of resourceAliases) aliases.add(alias);
      schemas.push({
        aliases: resourceAliases,
        base64: Buffer.from(text, "utf8").toString("base64"),
      });
    }
    if (!aliases.has(request.rootSchemaId))
      return outcome("defect", "not-evaluated", semantic, ["DIAG-XSD-ROOT"]);
    const worker = (options.worker ?? runXmlWorker)(
      {
        cpuSeconds: limits.maximumCpuSeconds,
        rootSchemaId: request.rootSchemaId,
        schemas,
        xmlBase64: Buffer.from(request.xml).toString("base64"),
      },
      {
        maximumOutputBytes: limits.maximumOutputBytes,
        pythonExecutable: options.pythonExecutable,
        timeoutMs: deadlineMs,
      },
    );
    if (options.signal?.aborted === true)
      return outcome("cancelled", "not-evaluated", semantic, [
        "DIAG-XML-CANCELLED",
      ]);
    if (worker.kind === "valid") return outcome("valid", "valid", semantic, []);
    if (worker.kind === "invalid")
      return outcome("invalid", "invalid", semantic, worker.diagnostics);
    if (worker.kind === "limit")
      return outcome("limit", "not-evaluated", semantic, worker.diagnostics);
    if (worker.kind === "unavailable")
      return outcome(
        "unavailable",
        "not-evaluated",
        semantic,
        worker.diagnostics,
      );
    return outcome("defect", "not-evaluated", semantic, worker.diagnostics);
  } catch (error) {
    const code =
      error instanceof TypeError ? "DIAG-XML-UTF8" : "DIAG-XSD-PROVIDER";
    return outcome("defect", "not-evaluated", semantic, [code]);
  }
}

export function scanXmlResources(xml, limits = DEFAULT_XML_LIMITS) {
  let depth = 0;
  let nodes = 0;
  let attributes = 0;
  let namespaces = 0;
  let textBytes = 0;
  let cursor = 0;
  while (cursor < xml.length) {
    const opening = xml.indexOf("<", cursor);
    if (opening < 0) {
      textBytes += Buffer.byteLength(xml.slice(cursor));
      break;
    }
    textBytes += Buffer.byteLength(xml.slice(cursor, opening));
    if (xml.startsWith("<!--", opening)) {
      const close = xml.indexOf("-->", opening + 4);
      if (close < 0) return "DIAG-XML-SYNTAX";
      nodes += 1;
      cursor = close + 3;
      continue;
    }
    if (xml.startsWith("<![CDATA[", opening)) {
      const close = xml.indexOf("]]>", opening + 9);
      if (close < 0) return "DIAG-XML-SYNTAX";
      textBytes += Buffer.byteLength(xml.slice(opening + 9, close));
      nodes += 1;
      cursor = close + 3;
      continue;
    }
    const close = findTagEnd(xml, opening + 1);
    if (close < 0) return "DIAG-XML-SYNTAX";
    const tag = xml.slice(opening + 1, close);
    if (tag.startsWith("?")) {
      cursor = close + 1;
      continue;
    }
    if (tag.startsWith("!")) return "DIAG-XML-SYNTAX";
    if (tag.startsWith("/")) depth -= 1;
    else {
      nodes += 1;
      const body = tag.endsWith("/") ? tag.slice(0, -1) : tag;
      const whitespace = body.search(/\s/u);
      if (whitespace >= 0) {
        const tail = body.slice(whitespace);
        const matches = [
          ...tail.matchAll(/\s+([^\s=]+)\s*=\s*(?:"[^"]*"|'[^']*')/gu),
        ];
        attributes += matches.length;
        namespaces += matches.filter((match) =>
          /^xmlns(?::|$)/u.test(match[1] ?? ""),
        ).length;
      }
      const elementDepth = depth + 1;
      if (elementDepth > limits.maximumDepth) return "DIAG-XML-DEPTH";
      if (!tag.endsWith("/")) depth = elementDepth;
    }
    if (depth < 0) return "DIAG-XML-SYNTAX";
    if (nodes > limits.maximumNodes) return "DIAG-XML-NODES";
    if (attributes > limits.maximumAttributes) return "DIAG-XML-ATTRIBUTES";
    if (namespaces > limits.maximumNamespaces) return "DIAG-XML-NAMESPACES";
    if (textBytes > limits.maximumTextBytes) return "DIAG-XML-TEXT";
    cursor = close + 1;
  }
  if (depth !== 0) return "DIAG-XML-SYNTAX";
  return textBytes > limits.maximumTextBytes ? "DIAG-XML-TEXT" : null;
}

function validRequest(request) {
  return (
    request !== null &&
    typeof request === "object" &&
    request.xml instanceof Uint8Array &&
    typeof request.rootSchemaId === "string" &&
    Array.isArray(request.schemas) &&
    ["valid", "invalid", "not-evaluated"].includes(request.semanticStatus) &&
    request.schemas.every(
      (schema) =>
        schema !== null &&
        typeof schema === "object" &&
        typeof schema.id === "string" &&
        schema.bytes instanceof Uint8Array &&
        /^[a-f0-9]{64}$/u.test(schema.sha256) &&
        (schema.aliases === undefined ||
          (Array.isArray(schema.aliases) &&
            schema.aliases.every((alias) => typeof alias === "string"))),
    )
  );
}

function normalizeLimits(overrides) {
  const limits = { ...DEFAULT_XML_LIMITS, ...(overrides ?? {}) };
  if (
    !Object.values(limits).every(
      (value) => Number.isSafeInteger(value) && value > 0,
    )
  )
    throw new Error("invalid limits");
  return limits;
}

function strictUtf8(bytes) {
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(
    bytes,
  );
}

function digestMatches(bytes, expected) {
  const actual = createHash("sha256").update(bytes).digest();
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}

function normalizeSchemaText(id, digest, text) {
  if (
    id !== "http://www.w3.org/TR/xmldsig-core/xmldsig-core-schema.xsd" ||
    digest !== PINNED_XMLDSIG_SHA256
  )
    return text;
  const normalized = text.replace(/<!DOCTYPE schema[\s\S]*?\]>\s*/u, "");
  if (normalized === text || /<!\s*(?:DOCTYPE|ENTITY)\b/iu.test(normalized))
    throw new Error("pinned XMLDSIG schema normalization failed");
  return normalized;
}

function findTagEnd(xml, start) {
  let quote = null;
  for (let index = start; index < xml.length; index += 1) {
    const character = xml[index];
    if (quote === null && (character === '"' || character === "'"))
      quote = character;
    else if (quote === character) quote = null;
    else if (quote === null && character === ">") return index;
  }
  return -1;
}

function outcome(status, xsd, semantic, diagnostics) {
  return Object.freeze({
    status,
    xsd,
    semantic,
    diagnostics: Object.freeze([...diagnostics]),
  });
}

export const TEST_ONLY_XML_PROVIDER = Object.freeze({
  findTagEnd,
  normalizeLimits,
  normalizeSchemaText,
  strictUtf8,
  validRequest,
});
