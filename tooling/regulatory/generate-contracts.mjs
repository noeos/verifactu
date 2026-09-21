#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const snapshot = "editions/source-snapshots/rrsif-2026-09-21-observed";
const snapshotRoot = resolve(root, snapshot);
const manifest = JSON.parse(
  await readFile(resolve(snapshotRoot, "manifest.json"), "utf8"),
);
const outputRoot = resolve(
  root,
  "editions/rrsif-2026-09-21-observed-candidate/generated",
);
await mkdir(outputRoot, { recursive: true });

function sha(value) {
  return createHash("sha256").update(value).digest("hex");
}
function canonical(value) {
  const normalize = (v) =>
    Array.isArray(v)
      ? v.map(normalize)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, normalize(v[k])]),
          )
        : v;
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}
const sourceRecords = manifest.sources.filter(
  (source) => source.status !== "blocked",
);
const links = [];
for (const source of sourceRecords) {
  const bytes = await readFile(resolve(snapshotRoot, source.path));
  const text = bytes.toString("utf8");
  for (const match of text.matchAll(/href=["']([^"']+)["']/giu)) {
    const href = match[1];
    if (
      href.startsWith("http") ||
      href.includes("static_files") ||
      href.endsWith(".xsd") ||
      href.endsWith(".wsdl")
    )
      links.push({ sourceId: source.id, href });
  }
}
const uniqueLinks = [
  ...new Map(
    links.map((link) => [`${link.sourceId}\0${link.href}`, link]),
  ).values(),
].sort((a, b) =>
  `${a.sourceId}${a.href}`.localeCompare(`${b.sourceId}${b.href}`),
);
const blocked = manifest.blockedSources.map(({ id, blocker, url }) => ({
  id,
  blocker,
  url,
}));
const structural = {
  schemaVersion: 1,
  editionId: "rrsif-2026-09-21-observed-candidate",
  status: "blocked",
  sourceSnapshot: manifest.id,
  sourceManifestSha256: sha(
    await readFile(resolve(snapshotRoot, "manifest.json")),
  ),
  sourceClosure: sha(
    sourceRecords.map((source) => `${source.id}\0${source.sha256}`).join("\n"),
  ),
  generatedBy: {
    id: "RRSIF-CONTRACT-GENERATOR-0001",
    version: "1.0.0",
    configuration: "config/regulatory/source-plan.json",
  },
  mode: "metadata-only; no fiscal semantics are invented",
  discoveredOfficialLinks: uniqueLinks,
  structuralDeclarations: [],
  unresolvedOfficialArtifacts: blocked,
  creationAllowed: false,
  verificationAllowed: true,
};
const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "urn:noeos:verifactu:regulatory-edition:observed-candidate:v1",
  title: "Blocked regulatory edition envelope",
  type: "object",
  additionalProperties: false,
  required: ["editionId", "recordKind", "sourceSnapshot", "creationAllowed"],
  properties: {
    editionId: { type: "string", minLength: 1 },
    recordKind: { enum: ["blocked-envelope"] },
    sourceSnapshot: { type: "string", minLength: 1 },
    creationAllowed: { const: false },
    verificationAllowed: { const: true },
  },
};
const bindings = {
  schemaVersion: 1,
  editionId: structural.editionId,
  services: [],
  unresolved: blocked.filter(
    (entry) => entry.id.includes("0019") || entry.id.includes("0020"),
  ),
  networkAtRuntime: "denied",
};
const catalogues = {
  schemaVersion: 1,
  editionId: structural.editionId,
  entries: [],
  sourceEntryPoints: sourceRecords
    .filter((source) => /0021|0023|0024|0025/u.test(source.id))
    .map((source) => ({ id: source.id, role: source.role })),
  unresolved: blocked.filter((entry) => /0021|0023|0024|0025/u.test(entry.id)),
};
const constraints = {
  schemaVersion: 1,
  editionId: structural.editionId,
  fields: [],
  note: "No field constraint is asserted until authoritative AEAT payload bytes are admitted.",
};
const semanticOverlay = {
  schemaVersion: 1,
  editionId: structural.editionId,
  rules: sourceRecords
    .filter((source) => source.authority === "AEAT")
    .map((source) => ({
      id: `ENTRY-POINT-${source.id}`,
      sourceId: source.id,
      statement: `The ${source.role} is discovered from the authenticated AEAT entry-point page; linked payload bytes remain independently gated.`,
      kind: "source-graph-observation",
      creationImpact: "none",
    })),
  unresolved: blocked.map((entry) => entry.id),
  note: "This overlay records source custody facts only; it is not a fiscal rule implementation.",
};
const files = {
  "contract-manifest.json": structural,
  "public-schema.json": schema,
  "soap-bindings.json": bindings,
  "catalogues.json": catalogues,
  "field-constraints.json": constraints,
  "semantic-overlay.json": semanticOverlay,
};
for (const [name, value] of Object.entries(files))
  await writeFile(resolve(outputRoot, name), canonical(value), { mode: 0o644 });
const outputDigest = sha(
  Object.entries(files)
    .sort()
    .map(([name, value]) => `${name}\0${canonical(value)}`)
    .join("\n"),
);
const report = {
  schemaVersion: 1,
  generator: structural.generatedBy,
  editionId: structural.editionId,
  sourceManifestSha256: structural.sourceManifestSha256,
  outputs: Object.keys(files).sort(),
  outputDigest,
  deterministic: true,
  network: "denied",
  creationAllowed: false,
  blocked: blocked.map((entry) => entry.id),
};
await writeFile(
  resolve(outputRoot, "generation-report.json"),
  canonical(report),
  { mode: 0o644 },
);
process.stdout.write(
  `${JSON.stringify({ status: "passed", outputDigest, outputs: Object.keys(files).length, blocked: blocked.length })}\n`,
);
