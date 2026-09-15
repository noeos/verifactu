#!/usr/bin/env node
import { createHash } from "node:crypto";
import { copyFile, lstat, mkdir, readFile, rename, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, stableJson, validateJsonFile } from "../../tooling/lib/policy.mjs";
import { assertSafePlan } from "../../tooling/repository/check-regulatory-state.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function exactKeys(value, expected, code, subject) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), code, `${subject} must be an object`);
  assert(
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()),
    code,
    `${subject} shape differs`,
  );
}

async function writeAtomic(destination, bytes) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, bytes, { flag: "wx", mode: 0o644 });
  await rename(temporary, destination);
}

export async function promoteSources(repositoryRoot, quarantineDirectory, destinationDirectory) {
  const existingDestination = await lstat(destinationDirectory).catch(() => null);
  assert(existingDestination === null, "IMMUTABLE_DESTINATION_EXISTS", "source snapshots are append-only");
  const stagingDirectory = `${destinationDirectory}.${process.pid}.tmp`;
  const lockPath = `${destinationDirectory}.promote.lock`;
  await mkdir(path.dirname(destinationDirectory), { recursive: true });
  assert(
    (await lstat(stagingDirectory).catch(() => null)) === null,
    "PROMOTION_STAGING_EXISTS",
    "promotion staging path exists",
  );
  const plan = await validateJsonFile(
    repositoryRoot,
    "config/regulatory/source-plan.json",
    "config/regulatory/source-plan.schema.json",
  );
  assertSafePlan(plan);
  const acquisitionBytes = await readFile(path.join(quarantineDirectory, "acquisition.json"));
  const acquisition = JSON.parse(acquisitionBytes);
  assert(
    acquisitionBytes.equals(Buffer.from(stableJson(acquisition))),
    "ACQUISITION_EVIDENCE_NONCANONICAL",
    "acquisition evidence is not canonical JSON",
  );
  exactKeys(
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
    "ACQUISITION_EVIDENCE_INVALID",
    "acquisition evidence",
  );
  assert(acquisition.schemaVersion === 1, "ACQUISITION_EVIDENCE_INVALID", "acquisition schema version differs");
  assert(acquisition.planId === plan.planId, "ACQUISITION_PLAN_MISMATCH", "quarantine came from another plan");
  assert(
    acquisition.planObservedAt === plan.observedAt,
    "ACQUISITION_TIME_MISMATCH",
    "quarantine observation time differs",
  );
  assert(
    acquisition.redirectPolicy === "manual-reject",
    "ACQUISITION_REDIRECT_POLICY_INVALID",
    "redirect policy differs",
  );
  assert(
    acquisition.tlsVerification === "runtime-default-required",
    "ACQUISITION_TLS_POLICY_INVALID",
    "TLS policy differs",
  );
  assert(
    acquisition.contentTypePolicy === "match-when-present-magic-always",
    "ACQUISITION_MEDIA_POLICY_INVALID",
    "media policy differs",
  );
  assert(
    acquisition.runtime === `${process.release.name} ${process.version}`,
    "ACQUISITION_RUNTIME_MISMATCH",
    "acquisition and promotion runtimes differ",
  );
  assert(
    Number.isFinite(Date.parse(acquisition.acquiredAt)) &&
      Date.parse(acquisition.acquiredAt) >= Date.parse(plan.observedAt),
    "ACQUISITION_TIME_INVALID",
    "acquisition time is invalid",
  );
  exactKeys(
    acquisition.networkPolicy,
    ["dns", "proxy", "requestTimeoutMs", "acceptedContentEncoding"],
    "ACQUISITION_NETWORK_POLICY_INVALID",
    "acquisition network policy",
  );
  assert(
    acquisition.networkPolicy.dns === "runtime-default" &&
      acquisition.networkPolicy.proxy === "node-fetch-default-no-environment-proxy" &&
      acquisition.networkPolicy.requestTimeoutMs === 30_000 &&
      acquisition.networkPolicy.acceptedContentEncoding === "identity-or-absent",
    "ACQUISITION_NETWORK_POLICY_INVALID",
    "acquisition network policy differs",
  );
  const acquisitionImporter = acquisition.importer?.artifacts?.find(
    ({ path: artifactPath }) => artifactPath === "internal/source-import/acquire.mjs",
  );
  const currentAcquirer = await readFile(path.join(repositoryRoot, "internal/source-import/acquire.mjs"));
  assert(
    acquisitionImporter?.sha256 === createHash("sha256").update(currentAcquirer).digest("hex"),
    "ACQUISITION_IMPORTER_MISMATCH",
    "quarantine was not produced by the admitted acquisition implementation",
  );
  assert(Array.isArray(acquisition.sources), "ACQUISITION_EVIDENCE_INVALID", "acquisition sources are absent");
  assert(
    acquisition.sources.length === acquisition.sourceCount,
    "ACQUISITION_COUNT_MISMATCH",
    "source evidence count differs",
  );
  assert(
    acquisition.sourceCount === plan.sources.length,
    "ACQUISITION_INCOMPLETE",
    "quarantine source count is incomplete",
  );
  const observedById = new Map(acquisition.sources.map((source) => [source.id, source]));
  assert(
    observedById.size === acquisition.sources.length,
    "ACQUISITION_SOURCE_DUPLICATE",
    "quarantine repeats a source identity",
  );
  await writeFile(lockPath, `${process.pid}\n`, { flag: "wx", mode: 0o600 }).catch((error) => {
    assert(false, "SOURCE_PROMOTION_LOCKED", `another promotion owns the destination: ${error.code}`);
  });
  const manifestSources = [];
  try {
    await mkdir(stagingDirectory, { recursive: false, mode: 0o755 });
    for (const source of plan.sources) {
      const observed = observedById.get(source.id);
      assert(observed, "ACQUISITION_SOURCE_MISSING", `${source.id} is absent from quarantine evidence`);
      exactKeys(
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
        "ACQUISITION_SOURCE_INVALID",
        `${source.id} acquisition entry`,
      );
      for (const field of ["bytes", "sha256", "sha512"]) {
        assert(observed[field] === source[field], "ACQUISITION_SOURCE_MISMATCH", `${source.id}.${field} differs`);
      }
      assert(
        observed.requestedUrl === source.url && observed.finalUrl === source.url,
        "ACQUISITION_SOURCE_MISMATCH",
        `${source.id} URL identity differs`,
      );
      assert(
        observed.lastModified === source.lastModified &&
          (observed.contentEncoding === null || observed.contentEncoding.toLowerCase() === "identity"),
        "ACQUISITION_SOURCE_MISMATCH",
        `${source.id} response metadata differs`,
      );
      const candidate = path.join(quarantineDirectory, "files", source.path);
      const stat = await lstat(candidate).catch(() => null);
      assert(stat?.isFile() && !stat.isSymbolicLink(), "SOURCE_FILE_UNSAFE", `${source.id} is not a regular file`);
      const bytes = await readFile(candidate);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const sha512 = createHash("sha512").update(bytes).digest("hex");
      assert(bytes.length === source.bytes, "SOURCE_LENGTH_DRIFT", `${source.id} changed after acquisition`);
      assert(
        sha256 === source.sha256 && sha512 === source.sha512,
        "SOURCE_DIGEST_DRIFT",
        `${source.id} changed after acquisition`,
      );
      const destination = path.join(stagingDirectory, "sources", source.path);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(candidate, `${destination}.${process.pid}.tmp`, 1);
      await rename(`${destination}.${process.pid}.tmp`, destination);
      manifestSources.push({
        id: source.id,
        sourceId: source.sourceId,
        title: source.title,
        authority: source.authority,
        role: source.role,
        url: source.url,
        path: `sources/${source.path}`,
        kind: source.kind,
        bytes: source.bytes,
        sha256: source.sha256,
        sha512: source.sha512,
        lastModified: source.lastModified,
        licenseId: source.licenseId,
        redistribution: source.redistribution,
        dependencies: source.dependencies,
        requiredFor: source.requiredFor,
      });
    }
    const promoterBytes = await readFile(path.join(repositoryRoot, "internal/source-import/promote.mjs"));
    const sourceManifest = {
      schemaVersion: 1,
      manifestId: "RRSIF-SOURCE-MANIFEST-2026-09-15",
      planId: plan.planId,
      observedAt: plan.observedAt,
      acquisition: {
        path: "custody/acquisition.json",
        sha256: createHash("sha256").update(stableJson(acquisition)).digest("hex"),
        runtime: acquisition.runtime,
        tlsVerification: acquisition.tlsVerification,
        redirectPolicy: acquisition.redirectPolicy,
        contentTypePolicy: acquisition.contentTypePolicy,
        importer: acquisition.importer,
        networkPolicy: acquisition.networkPolicy,
      },
      promotion: {
        id: "verifactu-regulatory-source-promotion-v1",
        runtime: `${process.release.name} ${process.version}`,
        offline: true,
        artifacts: [
          {
            path: "internal/source-import/promote.mjs",
            sha256: createHash("sha256").update(promoterBytes).digest("hex"),
          },
        ],
      },
      sourceCount: manifestSources.length,
      blockedSourceCount: plan.blockedSources.length,
      sources: manifestSources,
      blockedSources: plan.blockedSources,
    };
    await writeAtomic(path.join(stagingDirectory, "custody", "acquisition.json"), Buffer.from(stableJson(acquisition)));
    await writeAtomic(path.join(stagingDirectory, "source-manifest.json"), Buffer.from(stableJson(sourceManifest)));
    const sourceClosure = sourceManifest.sources.map(({ id, sha256, dependencies }) => ({ id, sha256, dependencies }));
    const sourceClosureSha256 = createHash("sha256").update(stableJson(sourceClosure)).digest("hex");
    const sourceManifestSha256 = createHash("sha256").update(stableJson(sourceManifest)).digest("hex");
    const snapshot = {
      schemaVersion: 1,
      snapshotId: path.basename(destinationDirectory),
      status: plan.blockedSources.length === 0 ? "imported" : "blocked",
      immutable: true,
      observedAt: plan.observedAt,
      sourcePlanSha256: createHash("sha256").update(stableJson(plan)).digest("hex"),
      sourceManifest: { path: "source-manifest.json", sha256: sourceManifestSha256 },
      sourceClosureSha256,
      sourceCount: sourceManifest.sourceCount,
      blockedSourceIds: plan.blockedSources.map(({ id }) => id).sort(),
      creationAllowed: false,
      reason:
        plan.blockedSources.length === 0
          ? "Source import is complete; contract generation and edition approval remain separate transitions."
          : "Mandatory official sources are unavailable. Bounded structural contract extraction may produce a blocked candidate, but no edition may be approved or create fiscal artifacts.",
    };
    await writeAtomic(path.join(stagingDirectory, "snapshot.json"), Buffer.from(stableJson(snapshot)));
    assert(
      (await lstat(destinationDirectory).catch(() => null)) === null,
      "IMMUTABLE_DESTINATION_EXISTS",
      "source snapshot destination appeared during promotion",
    );
    await rename(stagingDirectory, destinationDirectory);
    return {
      sourceCount: manifestSources.length,
      blockedSourceCount: plan.blockedSources.length,
      sourceManifestSha256,
      sourceClosureSha256,
      snapshotId: snapshot.snapshotId,
    };
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    throw error;
  } finally {
    await unlink(lockPath).catch(() => undefined);
  }
}

const quarantineIndex = process.argv.indexOf("--quarantine");
const destinationIndex = process.argv.indexOf("--destination");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(
    quarantineIndex >= 0 && process.argv[quarantineIndex + 1],
    "QUARANTINE_REQUIRED",
    "use --quarantine with an acquisition directory",
  );
  assert(
    destinationIndex >= 0 && process.argv[destinationIndex + 1],
    "DESTINATION_REQUIRED",
    "use --destination with an edition candidate directory",
  );
  await main("regulatory-source-promotion", () =>
    promoteSources(
      root,
      path.resolve(root, process.argv[quarantineIndex + 1]),
      path.resolve(root, process.argv[destinationIndex + 1]),
    ),
  );
}
