// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import prettier from "prettier";
import { assertProjectRoot, projectRoot, readJson, stableJson } from "./project.mjs";

await assertProjectRoot();
const manifest = await readJson(resolve(projectRoot, "regulatory/sources.json"));
const edition = manifest.edition;
const snapshot = resolve(projectRoot, "regulatory/snapshots", edition, "raw");
const output = resolve(projectRoot, "contracts/editions", edition);
const generatedSource = resolve(projectRoot, "packages/verifactu/src/generated/edition.ts");
const typeEntries = [];
const operationEntries = [];
const sourceMap = [];
const generatedDigests = [];

for (const artifact of manifest.artifacts ?? []) {
  if (artifact.kind !== "xsd" && artifact.kind !== "wsdl") continue;
  const bytes = await readFile(resolve(snapshot, artifact.file));
  if (hash(bytes, "sha256") !== artifact.sha256 || hash(bytes, "sha512") !== artifact.sha512)
    throw new Error(`Cannot generate from unverified source: ${artifact.id}`);
  const xml = bytes.toString("utf8");
  preflight(xml, artifact.id);
  const document = parse(xml, artifact.id);
  const elements = [...document.getElementsByTagName("*")];
  for (const element of elements) {
    const local = element.localName ?? element.nodeName.split(":").pop() ?? element.nodeName;
    const namespace = element.namespaceURI ?? "";
    const name = element.getAttribute("name");
    if (name) {
      const kind =
        local === "element" || local === "attribute" || local.endsWith("Type")
          ? local
          : "declaration";
      const location = locator(element);
      const entry = {
        id: `${artifact.id}/${kind}/${name}${location}`,
        artifact: artifact.id,
        kind,
        name,
        namespace,
        requirements: artifact.requirements ?? [],
      };
      typeEntries.push(entry);
      sourceMap.push({ ...entry, locator: location });
    }
    if (artifact.kind === "wsdl" && local === "operation" && name) {
      operationEntries.push({
        id: `${artifact.id}/operation/${name}${locator(element)}`,
        artifact: artifact.id,
        name,
        requirements: artifact.requirements ?? [],
        locator: locator(element),
      });
    }
  }
}

typeEntries.sort(compareEntry);
operationEntries.sort(compareEntry);
sourceMap.sort(compareEntry);
const contractManifest = {
  schemaVersion: 1,
  edition,
  generatedBy: "@noeos/verifactu-contract-generator@1",
  sourceDigest: hash(Buffer.from(stableJson(manifest)), "sha256"),
  artifacts: (manifest.artifacts ?? []).map(({ id, kind, file, bytes, sha256, sha512 }) => ({
    id,
    kind,
    file,
    bytes,
    sha256,
    sha512,
  })),
  counts: { declarations: typeEntries.length, operations: operationEntries.length },
};
const files = {
  "manifest.json": contractManifest,
  "type-catalog.json": { schemaVersion: 1, edition, entries: typeEntries },
  "operation-catalog.json": { schemaVersion: 1, edition, entries: operationEntries },
  "source-map.json": { schemaVersion: 1, edition, entries: sourceMap },
  "schemas/contract-manifest.schema.json": {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    required: ["schemaVersion", "edition", "sourceDigest", "artifacts", "counts"],
    additionalProperties: false,
    properties: {
      schemaVersion: { const: 1 },
      edition: { type: "string", minLength: 1 },
      sourceDigest: { type: "string", pattern: "^[a-f0-9]{64}$" },
      artifacts: { type: "array", minItems: 1 },
      counts: { type: "object", required: ["declarations", "operations"] },
    },
  },
};
await mkdir(output, { recursive: true });
for (const [name, value] of Object.entries(files)) {
  const bytes = Buffer.from(stableJson(value));
  await mkdir(dirname(resolve(output, name)), { recursive: true });
  await writeFile(resolve(output, name), bytes);
  generatedDigests.push({
    file: name,
    sha256: hash(bytes, "sha256"),
    sha512: hash(bytes, "sha512"),
    bytes: bytes.length,
  });
}
await writeFile(
  resolve(output, "checksums.json"),
  stableJson({ schemaVersion: 1, edition, files: generatedDigests }),
);
const source = `// SPDX-License-Identifier: Apache-2.0\n// GENERATED FILE; do not edit. Edition: ${edition}\n\nexport const editionInfo = ${JSON.stringify({ ...contractManifest, generatedDigest: hash(Buffer.from(stableJson(generatedDigests)), "sha256") }, null, 2)} as const;\n\nexport const typeCatalog = ${JSON.stringify(typeEntries, null, 2)} as const;\n\nexport const operationCatalog = ${JSON.stringify(operationEntries, null, 2)} as const;\n\nexport const contractSchema = ${JSON.stringify(files["schemas/contract-manifest.schema.json"], null, 2)} as const;\n`;
await mkdir(resolve(projectRoot, "packages/verifactu/src/generated"), { recursive: true });
const prettierConfig = (await prettier.resolveConfig(generatedSource)) ?? {};
await writeFile(
  generatedSource,
  await prettier.format(source, { ...prettierConfig, parser: "typescript" }),
);
console.log(
  `Contracts generated: ${edition}, ${typeEntries.length} declarations, ${operationEntries.length} operations.`,
);

function parse(xml, id) {
  let parseError;
  const document = new DOMParser({
    onError: (message) => {
      parseError = message;
    },
  }).parseFromString(xml, "application/xml");
  if (parseError || !document.documentElement)
    throw new Error(`Invalid XML ${id}: ${parseError ?? "empty document"}`);
  return document;
}

function preflight(xml, id) {
  if (/<!DOCTYPE|<!ENTITY|<!\[CDATA\[/u.test(xml)) throw new Error(`Unsafe XML construct in ${id}`);
  if (!/<[A-Za-z_][A-Za-z0-9_.:-]*(?:\s|>)/u.test(xml) || /<\s*\/?\s*script\b/iu.test(xml))
    throw new Error(`Unsafe XML envelope in ${id}`);
}

function locator(element) {
  const path = [];
  let current = element;
  while (current && current.nodeType === 1) {
    let index = 1;
    let sibling = current.previousSibling;
    while (sibling) {
      if (sibling.nodeType === 1 && sibling.nodeName === current.nodeName) index += 1;
      sibling = sibling.previousSibling;
    }
    path.unshift(`${current.nodeName}[${index}]`);
    current = current.parentNode;
  }
  return `/${path.join("/")}`;
}

function compareEntry(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function hash(bytes, algorithm) {
  return createHash(algorithm).update(bytes).digest("hex");
}
