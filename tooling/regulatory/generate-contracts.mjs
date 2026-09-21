#!/usr/bin/env node
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const snapshotRelative =
  "editions/source-snapshots/rrsif-2026-09-21-authoritative";
const snapshotRoot = resolve(root, snapshotRelative);
const outputRelative =
  "editions/rrsif-2026-09-21-authoritative-candidate/generated";
const outputRoot = resolve(root, outputRelative);
const manifestBytes = await readFile(resolve(snapshotRoot, "manifest.json"));
const manifest = JSON.parse(manifestBytes);
const semanticRules = JSON.parse(
  await readFile(
    resolve(root, "config/regulatory/semantic-rules-p3b.json"),
    "utf8",
  ),
);

function fail(code, detail) {
  throw Object.assign(new Error(`${code}: ${detail}`), { code });
}
function sha(value) {
  return createHash("sha256").update(value).digest("hex");
}
function canonical(value) {
  const normalize = (item) =>
    Array.isArray(item)
      ? item.map(normalize)
      : item && typeof item === "object"
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, normalize(item[key])]),
          )
        : item;
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}
async function writeAtomic(path, bytes) {
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, { mode: 0o644 });
  await rename(temporary, path);
}
function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(
    /(?:^|\s)([A-Za-z_][\w:.-]*)\s*=\s*(["'])(.*?)\2/gsu,
  ))
    result[match[1]] = match[3];
  return result;
}
function xmlContract(source, bytes) {
  if (bytes.length > 2 * 1024 * 1024) fail("XML_INPUT_TOO_LARGE", source.id);
  const text = bytes.toString("utf8");
  if (/<!\s*(?:DOCTYPE|ENTITY)/iu.test(text))
    fail("XML_EXTERNAL_DECLARATION", source.id);
  for (const remote of text.matchAll(
    /schemaLocation\s*=\s*["']((?:https?:|file:|\/\/)[^"']+)["']/giu,
  )) {
    const allowed =
      remote[1] ===
        "http://www.w3.org/TR/xmldsig-core/xmldsig-core-schema.xsd" &&
      manifest.sources.some(
        (entry) =>
          entry.id === "SRC-STD-XMLDSIG" && entry.status === "captured",
      );
    if (!allowed) fail("XML_EXTERNAL_REFERENCE", `${source.id}:${remote[1]}`);
  }
  const declarations = [];
  const dependencies = [];
  let depth = 0;
  let maximumDepth = 0;
  for (const match of text.matchAll(/<([^!?][^>]*?)>/gsu)) {
    const body = match[1].trim();
    if (body.startsWith("/")) {
      depth -= 1;
      if (depth < 0) fail("XML_STRUCTURE", source.id);
      continue;
    }
    const selfClosing = body.endsWith("/");
    const [qualified = ""] = body.split(/\s/u, 1);
    const local = qualified.replace(/\/$/u, "").split(":").at(-1);
    const attrs = attributes(body);
    if (["include", "import"].includes(local) && attrs.schemaLocation) {
      if (
        attrs.schemaLocation.includes("\\") ||
        attrs.schemaLocation.split("/").includes("..")
      )
        fail("XML_PATH_ESCAPE", source.id);
      dependencies.push(attrs.schemaLocation);
    }
    if (
      [
        "schema",
        "element",
        "attribute",
        "complexType",
        "simpleType",
        "group",
        "message",
        "part",
        "portType",
        "operation",
        "binding",
        "service",
        "port",
      ].includes(local)
    ) {
      declarations.push({
        kind: local,
        ...(attrs.name ? { name: attrs.name } : {}),
        ...(attrs.type ? { type: attrs.type } : {}),
        ...(attrs.ref ? { ref: attrs.ref } : {}),
        ...(attrs.element ? { element: attrs.element } : {}),
        ...(attrs.minOccurs ? { minOccurs: attrs.minOccurs } : {}),
        ...(attrs.maxOccurs ? { maxOccurs: attrs.maxOccurs } : {}),
        ...(attrs.targetNamespace
          ? { targetNamespace: attrs.targetNamespace }
          : {}),
        ...(attrs.location ? { location: attrs.location } : {}),
      });
    }
    if (!selfClosing) {
      depth += 1;
      maximumDepth = Math.max(maximumDepth, depth);
      if (depth > 64) fail("XML_NESTING_LIMIT", source.id);
    }
  }
  if (depth !== 0) fail("XML_STRUCTURE", source.id);
  return {
    sourceId: source.id,
    file: basename(source.path),
    sha256: source.sha256,
    declarations,
    dependencies: [...new Set(dependencies)].sort(),
    maximumDepth,
  };
}

const xmlSources = manifest.sources.filter(
  (source) =>
    source.authority !== "W3C" &&
    (source.path.endsWith(".xsd") || source.path.endsWith(".wsdl")),
);
const parsed = [];
for (const source of xmlSources)
  parsed.push(
    xmlContract(source, await readFile(resolve(snapshotRoot, source.path))),
  );
const declarationKey = (entry) =>
  `${entry.sourceId}\0${entry.kind}\0${entry.name ?? ""}\0${entry.ref ?? ""}`;
const structuralDeclarations = parsed
  .flatMap((document) =>
    document.declarations.map((declaration) => ({
      sourceId: document.sourceId,
      ...declaration,
    })),
  )
  .sort((a, b) => declarationKey(a).localeCompare(declarationKey(b)));
const fieldConstraints = structuralDeclarations.filter((entry) =>
  ["element", "attribute", "simpleType"].includes(entry.kind),
);
const enumerationEntries = [];
for (const source of xmlSources.filter((entry) =>
  entry.path.endsWith(".xsd"),
)) {
  const text = (await readFile(resolve(snapshotRoot, source.path))).toString(
    "utf8",
  );
  for (const match of text.matchAll(
    /<(?:\w+:)?enumeration\b([^>]*)\/?\s*>/gsu,
  )) {
    const value = attributes(match[1]).value;
    if (value !== undefined)
      enumerationEntries.push({ sourceId: source.id, value });
  }
}
enumerationEntries.sort((a, b) =>
  `${a.sourceId}\0${a.value}`.localeCompare(`${b.sourceId}\0${b.value}`),
);
const wsdl = structuralDeclarations.filter((entry) =>
  ["service", "port", "binding", "portType", "operation", "message"].includes(
    entry.kind,
  ),
);
const sourceManifestSha256 = sha(manifestBytes);
const sourceClosure = sha(
  manifest.sources.map((source) => `${source.id}\0${source.sha256}`).join("\n"),
);
for (const rule of semanticRules.rules) {
  const source = manifest.sources.find((entry) => entry.id === rule.sourceId);
  if (
    !source ||
    !Array.isArray(rule.pages) ||
    rule.pages.length !== 2 ||
    rule.pages.some((page) => !Number.isInteger(page) || page < 1)
  )
    fail("SEMANTIC_RULE_SOURCE", rule.id);
}
const files = {
  "contract-manifest.json": {
    schemaVersion: 1,
    editionId: manifest.editionId,
    status: "candidate",
    sourceSnapshot: manifest.id,
    sourceManifestSha256,
    sourceClosure,
    generatedBy: { id: "RRSIF-CONTRACT-GENERATOR-0002", version: "2.0.0" },
    structuralDeclarationCount: structuralDeclarations.length,
    fieldConstraintCount: fieldConstraints.length,
    enumerationCount: enumerationEntries.length,
    semanticRuleCount: semanticRules.rules.length,
    networkAtGeneration: "denied",
    networkAtRuntime: "denied",
    creationAllowed: false,
    verificationAllowed: true,
  },
  "structural-contract.json": {
    schemaVersion: 1,
    editionId: manifest.editionId,
    documents: parsed,
    declarations: structuralDeclarations,
  },
  "field-constraints.json": {
    schemaVersion: 1,
    editionId: manifest.editionId,
    fields: fieldConstraints,
  },
  "catalogues.json": {
    schemaVersion: 1,
    editionId: manifest.editionId,
    entries: enumerationEntries,
    validationCatalogue: {
      sourceId: "SRC-0021-PDF",
      version: "1.2.2",
      executionImplemented: false,
    },
  },
  "soap-bindings.json": {
    schemaVersion: 1,
    editionId: manifest.editionId,
    declarations: wsdl,
    networkAtRuntime: "denied",
  },
  "semantic-overlay.json": {
    ...semanticRules,
    sourceManifestSha256,
    executionImplemented: false,
  },
  "public-schema.json": {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "urn:noeos:verifactu:regulatory-edition:authoritative-candidate:v1",
    title: "RRSIF authoritative candidate contract envelope",
    type: "object",
    additionalProperties: false,
    required: ["editionId", "recordKind", "payload"],
    properties: {
      editionId: { const: manifest.editionId },
      recordKind: {
        enum: ["invoice-registration", "invoice-cancellation", "event"],
      },
      payload: { type: "object" },
    },
  },
};
await mkdir(outputRoot, { recursive: true });
for (const [name, value] of Object.entries(files))
  await writeAtomic(resolve(outputRoot, name), canonical(value));
const outputDigest = sha(
  Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}\0${canonical(value)}`)
    .join("\n"),
);
const report = {
  schemaVersion: 1,
  generator: files["contract-manifest.json"].generatedBy,
  editionId: manifest.editionId,
  sourceManifestSha256,
  inputs: xmlSources.length,
  outputs: Object.keys(files).sort(),
  populations: {
    sourceArtifacts: manifest.sources.length,
    xmlDocuments: xmlSources.length,
    structuralDeclarations: structuralDeclarations.length,
    fieldConstraints: fieldConstraints.length,
    enumerations: enumerationEntries.length,
    soapDeclarations: wsdl.length,
    semanticRules: semanticRules.rules.length,
  },
  outputDigest,
  deterministic: true,
  network: "denied",
  creationAllowed: false,
  blocked: [],
};
await writeAtomic(
  resolve(outputRoot, "generation-report.json"),
  canonical(report),
);
process.stdout.write(
  `${JSON.stringify({ status: "passed", outputDigest, ...report.populations })}\n`,
);
