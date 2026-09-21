#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const planPath = resolve(root, "config/regulatory/source-plan.json");
const snapshotRoot = resolve(
  root,
  "editions/source-snapshots/rrsif-2026-09-21-observed",
);
const plan = JSON.parse(await readFile(planPath, "utf8"));

function fail(code, detail) {
  const error = new Error(`${code}: ${detail}`);
  error.code = code;
  throw error;
}

function digest(bytes, algorithm) {
  return createHash(algorithm).update(bytes).digest("hex");
}

function contained(candidate) {
  const target = resolve(snapshotRoot, candidate);
  if (target !== snapshotRoot && !target.startsWith(`${snapshotRoot}${sep}`))
    fail("SOURCE_PATH_ESCAPE", candidate);
  return target;
}

const ids = new Set();
const records = [];
for (const source of plan.sources) {
  if (ids.has(source.id)) fail("SOURCE_DUPLICATE_ID", source.id);
  ids.add(source.id);
  if (source.status === "blocked") {
    records.push({ ...source, sha256: null, sha512: null, bytes: null });
    continue;
  }
  if (!source.path || source.path.includes("..") || source.path.includes("\\"))
    fail("SOURCE_PATH_INVALID", source.id);
  const path = contained(source.path);
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) fail("SOURCE_MISSING", source.path);
  if (info.size > plan.acquisition.maxBytes)
    fail("SOURCE_TOO_LARGE", source.id);
  const bytes = await readFile(path);
  records.push({
    ...source,
    bytes: bytes.length,
    sha256: digest(bytes, "sha256"),
    sha512: digest(bytes, "sha512"),
    mode: info.mode & 0o777,
    capturedRepresentation:
      "UTF-8 text committed as an immutable snapshot blob",
  });
}

const byId = new Map(records.map((record) => [record.id, record]));
for (const record of records) {
  for (const dependency of record.dependsOn ?? []) {
    if (!byId.has(dependency))
      fail("SOURCE_DEPENDENCY_MISSING", `${record.id}->${dependency}`);
  }
}
const manifest = {
  schemaVersion: 1,
  id: plan.snapshotId,
  observedAt: plan.observedAt,
  observation: plan.observation,
  authorityHierarchy: plan.authorityHierarchy,
  acquisition: plan.acquisition,
  sourcePlan: "config/regulatory/source-plan.json",
  sourcePlanSha256: digest(await readFile(planPath), "sha256"),
  sources: records.sort((a, b) => a.id.localeCompare(b.id)),
  blockedSources: records
    .filter((record) => record.status === "blocked")
    .map((record) => ({
      id: record.id,
      blocker: record.blocker,
      url: record.url,
    })),
  closure: {
    complete: records.every((record) => record.status !== "blocked"),
    requiredBeforeActivation: plan.requiredBeforeActivation,
    creationAllowed: false,
    verificationAllowed: true,
  },
};
const output = resolve(snapshotRoot, "manifest.json");
await import("node:fs/promises").then(({ writeFile }) =>
  writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o644 }),
);
process.stdout.write(
  `${JSON.stringify({ status: "passed", snapshot: manifest.id, captured: records.filter((r) => r.status !== "blocked").length, blocked: manifest.blockedSources.length, manifest: "editions/source-snapshots/rrsif-2026-09-21-observed/manifest.json" })}\n`,
);
