#!/usr/bin/env node
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const planPath = resolve(root, "config/regulatory/source-plan-p3b.json");
const observationPath = resolve(
  root,
  "config/regulatory/source-observation.json",
);
const plan = JSON.parse(await readFile(planPath, "utf8"));
const observationPolicy = JSON.parse(await readFile(observationPath, "utf8"));
const snapshotRoot = resolve(
  root,
  "editions/source-snapshots",
  plan.snapshotId,
);
const marker = process.argv.indexOf("--promote");
const promotionDirectories =
  marker < 0
    ? []
    : process.argv.slice(marker + 1).map((value) => resolve(value));

function fail(code, detail) {
  throw Object.assign(new Error(`${code}: ${detail}`), { code });
}
function digest(bytes, algorithm = "sha256") {
  return createHash(algorithm).update(bytes).digest("hex");
}
function contained(base, candidate) {
  const target = resolve(base, candidate);
  if (target !== base && !target.startsWith(`${base}${sep}`))
    fail("SOURCE_PATH_ESCAPE", candidate);
  return target;
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
function validateMagic(source, bytes) {
  if (
    source.mediaType === "application/pdf" &&
    bytes.subarray(0, 5).toString("ascii") !== "%PDF-"
  )
    fail("SOURCE_MEDIA_MAGIC", source.id);
  if (
    source.mediaType === "application/zip" &&
    !bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
  )
    fail("SOURCE_MEDIA_MAGIC", source.id);
  if (
    source.authority !== "W3C" &&
    (source.mediaType.includes("xml") || source.path.endsWith(".xsd")) &&
    /<!\s*(?:DOCTYPE|ENTITY)/iu.test(bytes.toString("utf8"))
  )
    fail("SOURCE_XML_EXTERNAL_DECLARATION", source.id);
  if (source.mediaType.startsWith("text/") && bytes.includes(0))
    fail("SOURCE_TEXT_NUL", source.id);
}
function validateZip(bytes, id) {
  const eocd = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) fail("SOURCE_ZIP_EOCD", id);
  const names = [];
  for (let offset = 0; offset + 46 <= eocd; offset += 1) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) continue;
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const name = bytes
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString("utf8");
    if (
      !name ||
      name.includes("\\") ||
      name.startsWith("/") ||
      name.split("/").includes("..")
    )
      fail("SOURCE_ZIP_PATH", `${id}:${name}`);
    if (bytes.readUInt32LE(offset + 38) >>> 28 === 0xa)
      fail("SOURCE_ZIP_SYMLINK", `${id}:${name}`);
    names.push(name);
    offset += 45 + nameLength + extraLength + commentLength;
  }
  if (names.length === 0 || new Set(names).size !== names.length)
    fail("SOURCE_ZIP_ENTRIES", id);
  return names.sort();
}
async function loadObservation(directory) {
  const manifestPath = contained(directory, "manifest.json");
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  if (manifest.tls !== plan.acquisition.tls)
    fail("OBSERVATION_TLS_POLICY", directory);
  const declared = plan.observations.find(
    (entry) =>
      entry.platform === manifest.platform &&
      entry.observedAt === manifest.observedAt,
  );
  if (!declared || declared.manifestSha256 !== digest(manifestBytes))
    fail("OBSERVATION_IDENTITY", directory);
  const records = new Map();
  for (const record of manifest.results) {
    if (record.status !== "captured") continue;
    const target = observationPolicy.targets.find(
      (entry) => entry.id === record.id,
    );
    if (!target || target.url !== record.url || target.file !== record.file)
      fail("OBSERVATION_TARGET", record.id);
    const path = contained(resolve(directory, "payloads"), record.file);
    const info = await stat(path);
    const bytes = await readFile(path);
    if (
      !info.isFile() ||
      bytes.length !== record.bytes ||
      bytes.length > plan.acquisition.maxBytes ||
      digest(bytes) !== record.sha256
    )
      fail("OBSERVATION_PAYLOAD", record.id);
    records.set(record.id, { ...record, bytes });
  }
  return { manifest, records };
}

const observations = [];
for (const directory of promotionDirectories)
  observations.push(await loadObservation(directory));
const sourceIds = new Set();
const records = [];
for (const source of plan.sources) {
  if (sourceIds.has(source.id)) fail("SOURCE_DUPLICATE_ID", source.id);
  sourceIds.add(source.id);
  if (!source.path || source.path.includes("..") || source.path.includes("\\"))
    fail("SOURCE_PATH_INVALID", source.id);
  const target = observationPolicy.targets.find(
    (entry) => entry.id === source.targetId,
  );
  if (!target) fail("SOURCE_TARGET_MISSING", source.targetId);
  let bytes;
  const witnessedBy = [];
  if (observations.length > 0) {
    const matches = observations.flatMap(({ manifest, records: available }) => {
      const match = available.get(source.targetId);
      return match ? [{ platform: manifest.platform, record: match }] : [];
    });
    if (
      source.id.includes("-") &&
      /(?:WSDL|XSD|PDF|INDEX|EXAMPLES)$/u.test(source.id)
    ) {
      for (const platform of ["Darwin-arm64", "Windows-X64"]) {
        const match = matches.find((entry) => entry.platform === platform);
        if (!match) fail("SOURCE_WITNESS_MISSING", `${source.id}:${platform}`);
        witnessedBy.push(platform);
      }
      if (
        new Set(
          matches
            .filter((entry) => witnessedBy.includes(entry.platform))
            .map((entry) => entry.record.sha256),
        ).size !== 1
      )
        fail("SOURCE_WITNESS_DISAGREEMENT", source.id);
    } else {
      const match =
        matches.find((entry) => entry.platform === "Linux-x86_64") ??
        matches[0];
      if (!match) fail("SOURCE_WITNESS_MISSING", source.id);
      witnessedBy.push(match.platform);
    }
    bytes = matches.find((entry) => witnessedBy.includes(entry.platform)).record
      .bytes;
    const path = contained(snapshotRoot, source.path);
    await mkdir(dirname(path), { recursive: true, mode: 0o755 });
    const temporary = `${path}.promotion-${process.pid}`;
    await writeFile(temporary, bytes, { mode: 0o644, flag: "wx" });
    await rename(temporary, path);
  } else {
    bytes = await readFile(contained(snapshotRoot, source.path));
    witnessedBy.push(
      ...(source.id.includes("-") &&
      /(?:WSDL|XSD|PDF|INDEX|EXAMPLES)$/u.test(source.id)
        ? ["Darwin-arm64", "Windows-X64"]
        : ["Linux-x86_64"]),
    );
  }
  if (
    bytes.length !== source.bytes ||
    digest(bytes) !== source.sha256 ||
    bytes.length > plan.acquisition.maxBytes
  )
    fail("SOURCE_PLAN_MISMATCH", source.id);
  validateMagic(source, bytes);
  const archiveEntries =
    source.mediaType === "application/zip"
      ? validateZip(bytes, source.id)
      : undefined;
  records.push({
    ...source,
    url: target.url,
    sha512: digest(bytes, "sha512"),
    status: "captured",
    witnessedBy,
    ...(archiveEntries ? { archiveEntries } : {}),
  });
}
for (const source of records)
  for (const dependency of source.dependsOn)
    if (!sourceIds.has(dependency))
      fail("SOURCE_DEPENDENCY_MISSING", `${source.id}->${dependency}`);
const manifest = {
  schemaVersion: 1,
  id: plan.snapshotId,
  editionId: plan.editionId,
  observedAt: plan.observedAt,
  immutable: true,
  authorityHierarchy: plan.authorityHierarchy,
  acquisition: plan.acquisition,
  observations: plan.observations,
  sourcePlan: "config/regulatory/source-plan-p3b.json",
  sourcePlanSha256: digest(await readFile(planPath)),
  sources: records.sort((a, b) => a.id.localeCompare(b.id)),
  blockedSources: [],
  closure: {
    complete: true,
    requiredBeforeActivation: [],
    creationAllowed: false,
    verificationAllowed: true,
  },
};
await mkdir(snapshotRoot, { recursive: true });
const manifestPath = resolve(snapshotRoot, "manifest.json");
const manifestTemporary = `${manifestPath}.tmp-${process.pid}`;
await writeFile(manifestTemporary, canonical(manifest), { mode: 0o644 });
await rename(manifestTemporary, manifestPath);
process.stdout.write(
  `${JSON.stringify({ status: "passed", snapshot: manifest.id, captured: records.length, blocked: 0, promoted: promotionDirectories.length > 0 })}\n`,
);
