#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, stableJson, validateJsonFile } from "../lib/policy.mjs";

function digest(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("hex");
}

function exactMembers(actual, expected, code, subject) {
  assert(
    JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort()),
    code,
    `${subject} expected ${expected.join(", ")}; observed ${actual.join(", ")}`,
  );
}

function exactObjectKeys(value, expected, code, subject) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), code, `${subject} must be an object`);
  exactMembers(Object.keys(value), expected, code, `${subject} keys`);
}

function assertToolIdentity(identity, expectedId, expectedPath, code) {
  exactObjectKeys(identity, ["id", "artifacts"], code, `${expectedId} identity`);
  assert(identity.id === expectedId, code, `${expectedId} ID differs`);
  assert(
    Array.isArray(identity.artifacts) && identity.artifacts.length === 1,
    code,
    `${expectedId} artifact set differs`,
  );
  exactObjectKeys(identity.artifacts[0], ["path", "sha256"], code, `${expectedId} artifact`);
  assert(identity.artifacts[0].path === expectedPath, code, `${expectedId} artifact path differs`);
  assert(/^[0-9a-f]{64}$/.test(identity.artifacts[0].sha256), code, `${expectedId} artifact digest is invalid`);
}

export function validateRegulatoryFiles(editions, schemas) {
  exactMembers(
    editions,
    ["README.md", "source-snapshots", "rrsif-2026-09-15-candidate.c0c6eb21f6d2"],
    "UNADMITTED_REGULATORY_EDITION",
    "editions root",
  );
  exactMembers(
    schemas,
    [
      "README.md",
      "regulatory-catalogues-v1.schema.json",
      "regulatory-contract-bundle-v1.schema.json",
      "regulatory-edition-descriptor-v1.schema.json",
      "regulatory-field-constraints-v1.schema.json",
      "regulatory-schema-graph-v1.schema.json",
      "regulatory-soap-bindings-v1.schema.json",
    ],
    "UNADMITTED_PUBLIC_SCHEMA",
    "schemas root",
  );
}

async function regularBytes(file, code) {
  const stat = await lstat(file).catch(() => null);
  assert(stat?.isFile() && !stat.isSymbolicLink(), code, `${file} must be a regular file`);
  return readFile(file);
}

async function walk(directory, root = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), "SOURCE_SNAPSHOT_SYMLINK", `snapshot contains symlink ${absolute}`);
    if (entry.isDirectory()) files.push(...(await walk(absolute, root)));
    else if (entry.isFile()) files.push(path.relative(root, absolute).split(path.sep).join("/"));
    else assert(false, "SOURCE_SNAPSHOT_SPECIAL_FILE", `snapshot contains special file ${absolute}`);
  }
  return files.sort();
}

export function assertSafePlan(plan) {
  const ids = new Set();
  const blockedIds = new Set();
  const paths = new Map();
  for (const source of plan.sources) {
    assert(!ids.has(source.id), "SOURCE_ID_DUPLICATE", `${source.id} is duplicated`);
    ids.add(source.id);
    const normalized = source.path.normalize("NFKC");
    assert(normalized === source.path, "SOURCE_PATH_UNICODE", `${source.path} is not NFKC`);
    const folded = normalized.toLocaleLowerCase("en-US");
    assert(!paths.has(folded), "SOURCE_PATH_COLLISION", `${source.path} collides with ${paths.get(folded)}`);
    paths.set(folded, source.path);
    assert(
      !source.path.split("/").some((segment) => segment === "" || segment === "." || segment === ".."),
      "SOURCE_PATH_TRAVERSAL",
      `${source.path} is unsafe`,
    );
  }
  for (const blocked of plan.blockedSources) {
    assert(!ids.has(blocked.id), "SOURCE_ID_COLLISION", `${blocked.id} is both acquired and blocked`);
    assert(!blockedIds.has(blocked.id), "BLOCKED_SOURCE_ID_DUPLICATE", `${blocked.id} is duplicated`);
    blockedIds.add(blocked.id);
  }
  const licenseIds = new Set(plan.sources.filter(({ role }) => role === "license").map(({ id }) => id));
  for (const source of plan.sources) {
    assert(licenseIds.has(source.licenseId), "SOURCE_LICENSE_OPEN", `${source.id} lacks admitted ${source.licenseId}`);
    for (const dependency of source.dependencies) {
      assert(ids.has(dependency), "SOURCE_DEPENDENCY_OPEN", `${source.id} depends on absent ${dependency}`);
    }
  }
  const active = new Set();
  const complete = new Set();
  const byId = new Map(plan.sources.map((source) => [source.id, source]));
  const visit = (id) => {
    assert(!active.has(id), "SOURCE_DEPENDENCY_CYCLE", `source dependency cycle reaches ${id}`);
    if (complete.has(id)) return;
    active.add(id);
    for (const dependency of byId.get(id).dependencies) visit(dependency);
    active.delete(id);
    complete.add(id);
  };
  for (const id of ids) visit(id);
  return { ids, licenseIds };
}

async function verifySnapshot(repositoryRoot, plan, snapshotDirectory, primaryNodeVersion) {
  const planDigest = digest("sha256", stableJson(plan));
  const expectedSnapshotId = `rrsif-2026-09-15+src.${planDigest.slice(0, 12)}`;
  assert(
    path.basename(snapshotDirectory) === expectedSnapshotId,
    "SOURCE_SNAPSHOT_ID_MISMATCH",
    "snapshot ID is not content-bound",
  );
  const sourceManifestBytes = await regularBytes(
    path.join(snapshotDirectory, "source-manifest.json"),
    "SOURCE_MANIFEST_MISSING",
  );
  const sourceManifest = JSON.parse(sourceManifestBytes);
  const acquisitionBytes = await regularBytes(
    path.join(snapshotDirectory, "custody", "acquisition.json"),
    "SOURCE_ACQUISITION_EVIDENCE_MISSING",
  );
  const acquisition = JSON.parse(acquisitionBytes);
  const snapshotBytes = await regularBytes(
    path.join(snapshotDirectory, "snapshot.json"),
    "SOURCE_SNAPSHOT_MANIFEST_MISSING",
  );
  const snapshot = JSON.parse(snapshotBytes);
  assert(
    sourceManifestBytes.equals(Buffer.from(stableJson(sourceManifest))),
    "SOURCE_MANIFEST_NONCANONICAL",
    "source manifest is not canonical JSON",
  );
  assert(
    acquisitionBytes.equals(Buffer.from(stableJson(acquisition))),
    "SOURCE_ACQUISITION_NONCANONICAL",
    "acquisition evidence is not canonical JSON",
  );
  assert(
    snapshotBytes.equals(Buffer.from(stableJson(snapshot))),
    "SOURCE_SNAPSHOT_NONCANONICAL",
    "snapshot manifest is not canonical JSON",
  );
  exactObjectKeys(
    acquisition,
    [
      "schemaVersion",
      "planId",
      "planObservedAt",
      "acquiredAt",
      "runtime",
      "importer",
      "networkPolicy",
      "redirectPolicy",
      "tlsVerification",
      "contentTypePolicy",
      "sourceCount",
      "sources",
    ],
    "SOURCE_ACQUISITION_SHAPE_INVALID",
    "acquisition evidence",
  );
  exactObjectKeys(
    sourceManifest,
    [
      "schemaVersion",
      "manifestId",
      "planId",
      "observedAt",
      "acquisition",
      "promotion",
      "sourceCount",
      "blockedSourceCount",
      "sources",
      "blockedSources",
    ],
    "SOURCE_MANIFEST_SHAPE_INVALID",
    "source manifest",
  );
  exactObjectKeys(
    sourceManifest.acquisition,
    [
      "path",
      "sha256",
      "runtime",
      "tlsVerification",
      "redirectPolicy",
      "contentTypePolicy",
      "importer",
      "networkPolicy",
    ],
    "SOURCE_MANIFEST_ACQUISITION_SHAPE_INVALID",
    "source manifest acquisition",
  );
  exactObjectKeys(
    snapshot,
    [
      "schemaVersion",
      "snapshotId",
      "status",
      "immutable",
      "observedAt",
      "sourcePlanSha256",
      "sourceManifest",
      "sourceClosureSha256",
      "sourceCount",
      "blockedSourceIds",
      "creationAllowed",
      "reason",
    ],
    "SOURCE_SNAPSHOT_SHAPE_INVALID",
    "source snapshot",
  );
  assert(sourceManifest.planId === plan.planId, "SOURCE_MANIFEST_PLAN_MISMATCH", "source manifest plan differs");
  assert(sourceManifest.observedAt === plan.observedAt, "SOURCE_MANIFEST_TIME_MISMATCH", "observation time differs");
  assert(sourceManifest.sourceCount === plan.sources.length, "SOURCE_MANIFEST_INCOMPLETE", "source count differs");
  assert(
    sourceManifest.blockedSourceCount === plan.blockedSources.length,
    "SOURCE_BLOCKER_COUNT_MISMATCH",
    "blocker count differs",
  );
  assert(acquisition.planId === plan.planId, "SOURCE_ACQUISITION_PLAN_MISMATCH", "acquisition plan differs");
  assert(
    acquisition.planObservedAt === plan.observedAt,
    "SOURCE_ACQUISITION_TIME_MISMATCH",
    "acquisition observation time differs",
  );
  assert(
    Number.isFinite(Date.parse(acquisition.acquiredAt)),
    "SOURCE_ACQUISITION_TIME_INVALID",
    "acquisition time is invalid",
  );
  assert(
    Date.parse(acquisition.acquiredAt) >= Date.parse(plan.observedAt),
    "SOURCE_ACQUISITION_TIME_INVALID",
    "acquisition predates observation",
  );
  assert(
    acquisition.sourceCount === plan.sources.length && acquisition.sources.length === plan.sources.length,
    "SOURCE_ACQUISITION_INCOMPLETE",
    "acquisition source count differs",
  );
  assert(
    acquisition.runtime === `node v${primaryNodeVersion}`,
    "SOURCE_ACQUISITION_RUNTIME_MISMATCH",
    "acquisition runtime is not primary",
  );
  assertToolIdentity(
    acquisition.importer,
    "verifactu-regulatory-source-acquisition-v1",
    "internal/source-import/acquire.mjs",
    "SOURCE_ACQUISITION_IMPORTER_INVALID",
  );
  const acquisitionImporterBytes = await regularBytes(
    path.join(repositoryRoot, acquisition.importer.artifacts[0].path),
    "SOURCE_ACQUISITION_IMPORTER_MISSING",
  );
  assert(
    digest("sha256", acquisitionImporterBytes) === acquisition.importer.artifacts[0].sha256,
    "SOURCE_ACQUISITION_IMPORTER_DRIFT",
    "acquisition implementation differs from custody",
  );
  exactObjectKeys(
    acquisition.networkPolicy,
    ["dns", "proxy", "requestTimeoutMs", "acceptedContentEncoding"],
    "SOURCE_NETWORK_POLICY_INVALID",
    "acquisition network policy",
  );
  assert(
    acquisition.networkPolicy.dns === "runtime-default" &&
      acquisition.networkPolicy.proxy === "node-fetch-default-no-environment-proxy" &&
      acquisition.networkPolicy.requestTimeoutMs === 30_000 &&
      acquisition.networkPolicy.acceptedContentEncoding === "identity-or-absent",
    "SOURCE_NETWORK_POLICY_INVALID",
    "acquisition network policy differs",
  );
  assert(
    acquisition.tlsVerification === "runtime-default-required",
    "SOURCE_TLS_POLICY_MISMATCH",
    "TLS verification was weakened",
  );
  assert(acquisition.redirectPolicy === "manual-reject", "SOURCE_REDIRECT_POLICY_MISMATCH", "redirect policy differs");
  assert(
    acquisition.contentTypePolicy === "match-when-present-magic-always",
    "SOURCE_MEDIA_POLICY_MISMATCH",
    "media verification policy differs",
  );
  assert(
    sourceManifest.acquisition.contentTypePolicy === acquisition.contentTypePolicy,
    "SOURCE_MEDIA_POLICY_MISMATCH",
    "source manifest loses media verification policy",
  );
  assert(
    stableJson(sourceManifest.acquisition.importer) === stableJson(acquisition.importer) &&
      stableJson(sourceManifest.acquisition.networkPolicy) === stableJson(acquisition.networkPolicy),
    "SOURCE_ACQUISITION_IDENTITY_LOST",
    "source manifest loses acquisition implementation or network identity",
  );
  exactObjectKeys(
    sourceManifest.promotion,
    ["id", "runtime", "offline", "artifacts"],
    "SOURCE_PROMOTION_IDENTITY_INVALID",
    "source promotion identity",
  );
  assert(
    sourceManifest.promotion.runtime === `node v${primaryNodeVersion}` && sourceManifest.promotion.offline === true,
    "SOURCE_PROMOTION_IDENTITY_INVALID",
    "source promotion runtime or network state differs",
  );
  assertToolIdentity(
    { id: sourceManifest.promotion.id, artifacts: sourceManifest.promotion.artifacts },
    "verifactu-regulatory-source-promotion-v1",
    "internal/source-import/promote.mjs",
    "SOURCE_PROMOTION_IDENTITY_INVALID",
  );
  const promotionBytes = await regularBytes(
    path.join(repositoryRoot, sourceManifest.promotion.artifacts[0].path),
    "SOURCE_PROMOTION_IMPLEMENTATION_MISSING",
  );
  assert(
    digest("sha256", promotionBytes) === sourceManifest.promotion.artifacts[0].sha256,
    "SOURCE_PROMOTION_IMPLEMENTATION_DRIFT",
    "promotion implementation differs from custody",
  );
  assert(
    sourceManifest.acquisition.sha256 === digest("sha256", acquisitionBytes),
    "SOURCE_ACQUISITION_DIGEST_MISMATCH",
    "acquisition evidence digest differs",
  );
  exactMembers(
    sourceManifest.blockedSources.map(({ id }) => id),
    plan.blockedSources.map(({ id }) => id),
    "SOURCE_BLOCKERS_MISMATCH",
    "blocked source IDs",
  );
  assert(
    stableJson(sourceManifest.blockedSources) === stableJson(plan.blockedSources),
    "SOURCE_BLOCKER_DETAILS_MISMATCH",
    "blocked source details differ from the plan",
  );
  const acquisitionById = new Map(acquisition.sources.map((source) => [source.id, source]));
  const manifestById = new Map(sourceManifest.sources.map((source) => [source.id, source]));
  assert(
    acquisitionById.size === acquisition.sources.length,
    "SOURCE_ACQUISITION_ID_DUPLICATE",
    "acquisition repeats an ID",
  );
  assert(manifestById.size === sourceManifest.sources.length, "SOURCE_MANIFEST_ID_DUPLICATE", "manifest repeats an ID");
  const expectedFiles = ["custody/acquisition.json", "snapshot.json", "source-manifest.json"];
  for (const source of plan.sources) {
    const imported = manifestById.get(source.id);
    const observed = acquisitionById.get(source.id);
    assert(imported && observed, "SOURCE_IMPORT_INCOMPLETE", `${source.id} is absent from custody`);
    exactObjectKeys(
      observed,
      [
        "id",
        "requestedUrl",
        "finalUrl",
        "bytes",
        "sha256",
        "sha512",
        "contentType",
        "contentEncoding",
        "etag",
        "lastModified",
      ],
      "SOURCE_ACQUISITION_ENTRY_SHAPE_INVALID",
      `${source.id} acquisition entry`,
    );
    exactObjectKeys(
      imported,
      [
        "id",
        "sourceId",
        "title",
        "authority",
        "role",
        "url",
        "path",
        "kind",
        "bytes",
        "sha256",
        "sha512",
        "lastModified",
        "licenseId",
        "redistribution",
        "dependencies",
        "requiredFor",
      ],
      "SOURCE_MANIFEST_ENTRY_SHAPE_INVALID",
      `${source.id} source manifest entry`,
    );
    for (const field of ["bytes", "sha256", "sha512", "lastModified"]) {
      assert(observed[field] === source[field], "SOURCE_ACQUISITION_MISMATCH", `${source.id}.${field} differs`);
    }
    assert(
      observed.requestedUrl === source.url && observed.finalUrl === source.url,
      "SOURCE_ACQUISITION_MISMATCH",
      `${source.id} URL identity differs`,
    );
    assert(
      observed.contentEncoding === null || observed.contentEncoding.toLowerCase() === "identity",
      "SOURCE_ACQUISITION_MISMATCH",
      `${source.id} content encoding differs`,
    );
    assert(imported.path === `sources/${source.path}`, "SOURCE_MANIFEST_PATH_MISMATCH", `${source.id} path differs`);
    for (const field of [
      "sourceId",
      "title",
      "authority",
      "role",
      "url",
      "kind",
      "bytes",
      "sha256",
      "sha512",
      "lastModified",
      "licenseId",
      "redistribution",
    ]) {
      assert(imported[field] === source[field], "SOURCE_MANIFEST_MISMATCH", `${source.id}.${field} differs`);
    }
    assert(
      stableJson(imported.dependencies) === stableJson(source.dependencies),
      "SOURCE_DEPENDENCY_MISMATCH",
      source.id,
    );
    assert(
      stableJson(imported.requiredFor) === stableJson(source.requiredFor),
      "SOURCE_REQUIREMENT_MISMATCH",
      source.id,
    );
    const bytes = await regularBytes(path.join(snapshotDirectory, imported.path), "SOURCE_BYTES_MISSING");
    assert(bytes.length === source.bytes, "SOURCE_LENGTH_MISMATCH", `${source.id} length differs`);
    assert(digest("sha256", bytes) === source.sha256, "SOURCE_SHA256_MISMATCH", `${source.id} SHA-256 differs`);
    assert(digest("sha512", bytes) === source.sha512, "SOURCE_SHA512_MISMATCH", `${source.id} SHA-512 differs`);
    expectedFiles.push(imported.path);
  }
  exactMembers(await walk(snapshotDirectory), expectedFiles, "SOURCE_SNAPSHOT_FILE_SET_MISMATCH", "snapshot files");
  const closure = sourceManifest.sources.map(({ id, sha256, dependencies }) => ({ id, sha256, dependencies }));
  const closureDigest = digest("sha256", stableJson(closure));
  assert(
    snapshot.schemaVersion === 1 && snapshot.snapshotId === expectedSnapshotId,
    "SOURCE_SNAPSHOT_MANIFEST_INVALID",
    "identity differs",
  );
  assert(
    snapshot.status === "blocked" && snapshot.immutable === true,
    "SOURCE_SNAPSHOT_STATUS_INVALID",
    "snapshot must remain immutable and blocked",
  );
  assert(
    snapshot.creationAllowed === false,
    "SOURCE_SNAPSHOT_CREATION_FORBIDDEN",
    "blocked snapshot cannot create records",
  );
  assert(snapshot.sourcePlanSha256 === planDigest, "SOURCE_PLAN_DIGEST_MISMATCH", "plan digest differs");
  assert(
    snapshot.sourceManifest.sha256 === digest("sha256", sourceManifestBytes),
    "SOURCE_MANIFEST_DIGEST_MISMATCH",
    "manifest digest differs",
  );
  assert(snapshot.sourceClosureSha256 === closureDigest, "SOURCE_CLOSURE_DIGEST_MISMATCH", "closure digest differs");
  exactMembers(
    snapshot.blockedSourceIds,
    plan.blockedSources.map(({ id }) => id),
    "SOURCE_SNAPSHOT_BLOCKERS_MISMATCH",
    "snapshot blockers",
  );
  return {
    expectedSnapshotId,
    closureDigest,
    snapshotSha256: digest("sha256", snapshotBytes),
    sourceManifestSha256: digest("sha256", sourceManifestBytes),
  };
}

export async function checkRegulatoryState(root) {
  const editions = await readdir(path.join(root, "editions"));
  const schemas = await readdir(path.join(root, "schemas"));
  validateRegulatoryFiles(editions, schemas);
  const plan = await validateJsonFile(
    root,
    "config/regulatory/source-plan.json",
    "config/regulatory/source-plan.schema.json",
  );
  const generation = await validateJsonFile(
    root,
    "config/regulatory/contract-generation.json",
    "config/regulatory/contract-generation.schema.json",
  );
  const { ids, licenseIds } = assertSafePlan(plan);
  const snapshotsRoot = path.join(root, "editions", "source-snapshots");
  const snapshots = await readdir(snapshotsRoot);
  assert(
    snapshots.length === 1,
    "SOURCE_SNAPSHOT_COUNT_INVALID",
    `expected one immutable source snapshot; observed ${snapshots.length}`,
  );
  const toolchains = JSON.parse(await readFile(path.join(root, "config/toolchain/profiles.json"), "utf8"));
  const primaryProfiles = Object.entries(toolchains.profiles).filter(([profile]) => profile.endsWith("-primary"));
  assert(
    primaryProfiles.length === 1,
    "PRIMARY_TOOLCHAIN_PROFILE_INVALID",
    `expected one primary profile; observed ${primaryProfiles.length}`,
  );
  const primaryNodeVersion = primaryProfiles[0][1].node;
  const verified = await verifySnapshot(root, plan, path.join(snapshotsRoot, snapshots[0]), primaryNodeVersion);
  const editionDirectory = path.join(root, "editions", generation.candidateEditionId);
  const editionBytes = await regularBytes(path.join(editionDirectory, "edition.json"), "REGULATORY_EDITION_MISSING");
  const edition = JSON.parse(editionBytes);
  assert(
    editionBytes.equals(Buffer.from(stableJson(edition))),
    "REGULATORY_EDITION_NONCANONICAL",
    "candidate edition is not canonical JSON",
  );
  exactObjectKeys(
    edition,
    [
      "schemaVersion",
      "editionId",
      "status",
      "immutable",
      "creationAllowed",
      "historicalVerificationAvailable",
      "sourceSnapshot",
      "generator",
      "contracts",
      "publicSchemas",
      "outputClosureSha256",
      "blockers",
      "approval",
      "reason",
    ],
    "REGULATORY_EDITION_SHAPE_INVALID",
    "candidate edition",
  );
  assert(
    edition.editionId === generation.candidateEditionId,
    "REGULATORY_EDITION_ID_MISMATCH",
    "candidate edition identity differs",
  );
  assert(
    edition.status === "candidate" && edition.immutable === true,
    "REGULATORY_EDITION_STATUS_INVALID",
    "edition must remain an immutable candidate",
  );
  assert(
    edition.creationAllowed === false && edition.approval === null,
    "REGULATORY_EDITION_CREATION_FORBIDDEN",
    "blocked candidate cannot be approved or create records",
  );
  exactObjectKeys(
    edition.sourceSnapshot,
    ["id", "path", "snapshotSha256", "sourceManifestSha256", "sourceClosureSha256"],
    "REGULATORY_EDITION_SOURCE_SHAPE_INVALID",
    "candidate source snapshot",
  );
  assert(
    edition.sourceSnapshot.path === `../source-snapshots/${verified.expectedSnapshotId}/snapshot.json`,
    "REGULATORY_EDITION_SOURCE_MISMATCH",
    "candidate source snapshot path differs",
  );
  assert(
    edition.sourceSnapshot.id === verified.expectedSnapshotId,
    "REGULATORY_EDITION_SOURCE_MISMATCH",
    "candidate references another snapshot",
  );
  assert(
    edition.sourceSnapshot.sourceClosureSha256 === verified.closureDigest,
    "REGULATORY_EDITION_SOURCE_MISMATCH",
    "candidate source closure differs",
  );
  assert(
    edition.sourceSnapshot.snapshotSha256 === verified.snapshotSha256 &&
      edition.sourceSnapshot.sourceManifestSha256 === verified.sourceManifestSha256,
    "REGULATORY_EDITION_SOURCE_MISMATCH",
    "candidate does not bind exact snapshot manifests",
  );
  assert(
    stableJson(edition.blockers) === stableJson(plan.blockedSources),
    "REGULATORY_EDITION_BLOCKERS_MISMATCH",
    "candidate blockers differ",
  );
  const expectedEditionFiles = ["edition.json"];
  for (const contract of edition.contracts) {
    assert(
      /^contracts\/[A-Za-z0-9][A-Za-z0-9._/-]+\.json$/.test(contract.path) && !contract.path.includes(".."),
      "REGULATORY_CONTRACT_PATH_INVALID",
      `${contract.path} is unsafe`,
    );
    const bytes = await regularBytes(path.join(editionDirectory, contract.path), "REGULATORY_CONTRACT_MISSING");
    assert(
      bytes.length === contract.bytes && digest("sha256", bytes) === contract.sha256,
      "REGULATORY_CONTRACT_DIGEST_MISMATCH",
      contract.path,
    );
    expectedEditionFiles.push(contract.path);
  }
  for (const schema of edition.publicSchemas) {
    assert(
      /^\.\.\/\.\.\/schemas\/[A-Za-z0-9][A-Za-z0-9._-]+\.json$/.test(schema.path),
      "REGULATORY_SCHEMA_PATH_INVALID",
      `${schema.path} is unsafe`,
    );
    const bytes = await regularBytes(path.resolve(editionDirectory, schema.path), "REGULATORY_SCHEMA_MISSING");
    assert(
      bytes.length === schema.bytes && digest("sha256", bytes) === schema.sha256,
      "REGULATORY_SCHEMA_DIGEST_MISMATCH",
      schema.path,
    );
  }
  assert(
    edition.outputClosureSha256 === digest("sha256", stableJson([...edition.contracts, ...edition.publicSchemas])),
    "REGULATORY_OUTPUT_CLOSURE_MISMATCH",
    "generated output closure differs",
  );
  exactMembers(
    await walk(editionDirectory),
    expectedEditionFiles,
    "REGULATORY_EDITION_FILE_SET_MISMATCH",
    "candidate edition files",
  );
  return {
    phase: "P3-W1-W4",
    sourceSnapshotCount: snapshots.length,
    officialSourceCount: ids.size,
    licenseIdentityCount: licenseIds.size,
    blockedSourceCount: plan.blockedSources.length,
    sourceSnapshotId: verified.expectedSnapshotId,
    sourceClosureSha256: verified.closureDigest,
    publicGeneratedSchemaCount: 6,
    runtimeNetworkRefresh: false,
    fiscalArtifactGenerationAllowed: false,
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main("regulatory-generated-state", () => checkRegulatoryState(root));
