#!/usr/bin/env node
import { cp, lstat, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { acquireSources } from "../../internal/source-import/acquire.mjs";
import { promoteSources } from "../../internal/source-import/promote.mjs";
import { PolicyFailure, assert, main, stableJson } from "../../tooling/lib/policy.mjs";
import { assertSafePlan } from "../../tooling/repository/check-regulatory-state.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function expectCode(id, expectedCode, operation) {
  try {
    await operation();
  } catch (error) {
    assert(error instanceof PolicyFailure, "FIXTURE_WRONG_FAILURE", `${id} produced ${error}`);
    assert(
      error.code === expectedCode,
      "FIXTURE_WRONG_REASON",
      `${id} expected ${expectedCode}; observed ${error.code}`,
    );
    return id;
  }
  throw new PolicyFailure("FIXTURE_UNEXPECTED_PASS", `${id} unexpectedly passed`);
}

function response(source, bytes, overrides = {}) {
  const declared = overrides.declaredBytes ?? bytes.length;
  const chunks = overrides.chunks ?? [bytes];
  return {
    status: overrides.status ?? 200,
    url: overrides.url ?? source.url,
    headers: new Headers({
      "content-length": String(declared),
      "content-encoding": overrides.contentEncoding ?? "identity",
      "content-type": overrides.contentType ?? source.accept.split(",", 1)[0],
      etag: overrides.etag ?? "",
      "last-modified": source.lastModified ?? "",
    }),
    body: {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) yield chunk;
      },
    },
  };
}

async function run() {
  const plan = JSON.parse(await readFile(path.join(root, "config/regulatory/source-plan.json"), "utf8"));
  const snapshotRoot = path.join(root, "editions/source-snapshots");
  const [snapshotId] = await readdir(snapshotRoot);
  const snapshot = path.join(snapshotRoot, snapshotId);
  const bytesByUrl = new Map(
    await Promise.all(
      plan.sources.map(async (source) => [source.url, await readFile(path.join(snapshot, "sources", source.path))]),
    ),
  );
  const first = plan.sources[0];
  const original = bytesByUrl.get(first.url);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "verifactu-regulatory-negative-"));
  const passed = [];
  try {
    const fetchFromSnapshot = async (url) => {
      const source = plan.sources.find((candidate) => candidate.url === url);
      return response(source, bytesByUrl.get(url));
    };
    const successfulQuarantine = path.join(temporaryRoot, "successful-quarantine");
    const acquisition = await acquireSources(root, successfulQuarantine, fetchFromSnapshot);
    assert(
      acquisition.sourceCount === plan.sources.length,
      "FIXTURE_ACQUISITION_INCOMPLETE",
      "mocked acquisition lost sources",
    );
    passed.push("complete-bounded-acquisition");
    passed.push(
      await expectCode("immutable-quarantine", "IMMUTABLE_QUARANTINE_EXISTS", () =>
        acquireSources(root, successfulQuarantine, fetchFromSnapshot),
      ),
    );

    const partialQuarantine = path.join(temporaryRoot, "partial-quarantine");
    let partialRequestCount = 0;
    const partialFailure = await expectCode("partial-acquisition-rollback", "SOURCE_HTTP_STATUS", () =>
      acquireSources(root, partialQuarantine, async (url) => {
        partialRequestCount += 1;
        const source = plan.sources.find((candidate) => candidate.url === url);
        return response(source, bytesByUrl.get(url), { status: partialRequestCount === 1 ? 200 : 503 });
      }),
    );
    assert(
      (await lstat(partialQuarantine).catch(() => null)) === null &&
        (await lstat(`${partialQuarantine}.${process.pid}.tmp`).catch(() => null)) === null &&
        (await lstat(`${partialQuarantine}.acquire.lock`).catch(() => null)) === null,
      "FIXTURE_PARTIAL_ACQUISITION_RETAINED",
      "failed acquisition retained published, staging or lock state",
    );
    passed.push(partialFailure);

    passed.push(
      await expectCode("http-status", "SOURCE_HTTP_STATUS", () =>
        acquireSources(root, path.join(temporaryRoot, "http-status"), async () =>
          response(first, original, { status: 503 }),
        ),
      ),
    );
    passed.push(
      await expectCode("redirect", "SOURCE_REDIRECT_FORBIDDEN", () =>
        acquireSources(root, path.join(temporaryRoot, "redirect"), async () =>
          response(first, original, { url: `${first.url}?redirected=true` }),
        ),
      ),
    );
    passed.push(
      await expectCode("declared-limit", "SOURCE_TOO_LARGE", () =>
        acquireSources(root, path.join(temporaryRoot, "declared-limit"), async () =>
          response(first, original, { declaredBytes: first.maximumBytes + 1 }),
        ),
      ),
    );
    passed.push(
      await expectCode("stream-limit", "SOURCE_TOO_LARGE", () =>
        acquireSources(root, path.join(temporaryRoot, "stream-limit"), async () =>
          response(first, original, {
            declaredBytes: first.maximumBytes,
            chunks: [Buffer.alloc(first.maximumBytes), Buffer.from([0])],
          }),
        ),
      ),
    );
    passed.push(
      await expectCode("content-type", "SOURCE_CONTENT_TYPE_MISMATCH", () =>
        acquireSources(root, path.join(temporaryRoot, "content-type"), async () =>
          response(first, original, { contentType: "text/plain" }),
        ),
      ),
    );
    passed.push(
      await expectCode("content-encoding", "SOURCE_CONTENT_ENCODING_FORBIDDEN", () =>
        acquireSources(root, path.join(temporaryRoot, "content-encoding"), async () =>
          response(first, original, { contentEncoding: "gzip" }),
        ),
      ),
    );
    passed.push(
      await expectCode("media-magic", "SOURCE_MAGIC_MISMATCH", () =>
        acquireSources(root, path.join(temporaryRoot, "media-magic"), async () =>
          response(first, Buffer.alloc(original.length, 0x20)),
        ),
      ),
    );
    const tampered = Buffer.from(original);
    tampered[tampered.length - 1] ^= 1;
    passed.push(
      await expectCode("digest-drift", "SOURCE_SHA256_DRIFT", () =>
        acquireSources(root, path.join(temporaryRoot, "digest-drift"), async () => response(first, tampered)),
      ),
    );

    const unsafePlan = structuredClone(plan);
    unsafePlan.sources[1].path = unsafePlan.sources[0].path.toUpperCase();
    passed.push(await expectCode("path-collision", "SOURCE_PATH_COLLISION", () => assertSafePlan(unsafePlan)));
    const cyclicPlan = structuredClone(plan);
    cyclicPlan.sources[0].dependencies = [cyclicPlan.sources[0].id];
    passed.push(await expectCode("dependency-cycle", "SOURCE_DEPENDENCY_CYCLE", () => assertSafePlan(cyclicPlan)));
    const openLicencePlan = structuredClone(plan);
    openLicencePlan.sources[0].licenseId = "ABSENT-LICENCE";
    passed.push(await expectCode("open-licence", "SOURCE_LICENSE_OPEN", () => assertSafePlan(openLicencePlan)));

    const promoted = path.join(temporaryRoot, "promoted");
    const promotion = await promoteSources(root, successfulQuarantine, promoted);
    assert(promotion.sourceCount === plan.sources.length, "FIXTURE_PROMOTION_INCOMPLETE", "promotion lost sources");
    passed.push("offline-complete-promotion");
    passed.push(
      await expectCode("immutable-destination", "IMMUTABLE_DESTINATION_EXISTS", () =>
        promoteSources(root, successfulQuarantine, promoted),
      ),
    );

    const importerDriftQuarantine = path.join(temporaryRoot, "importer-drift-quarantine");
    await cp(successfulQuarantine, importerDriftQuarantine, { recursive: true, force: false, errorOnExist: true });
    const importerDriftPath = path.join(importerDriftQuarantine, "acquisition.json");
    const importerDrift = JSON.parse(await readFile(importerDriftPath, "utf8"));
    importerDrift.importer.artifacts[0].sha256 = "0".repeat(64);
    await writeFile(importerDriftPath, stableJson(importerDrift));
    passed.push(
      await expectCode("acquisition-importer-drift", "ACQUISITION_IMPORTER_MISMATCH", () =>
        promoteSources(root, importerDriftQuarantine, path.join(temporaryRoot, "importer-drift-promotion")),
      ),
    );

    const networkDriftQuarantine = path.join(temporaryRoot, "network-drift-quarantine");
    await cp(successfulQuarantine, networkDriftQuarantine, { recursive: true, force: false, errorOnExist: true });
    const networkDriftPath = path.join(networkDriftQuarantine, "acquisition.json");
    const networkDrift = JSON.parse(await readFile(networkDriftPath, "utf8"));
    networkDrift.networkPolicy.acceptedContentEncoding = "any";
    await writeFile(networkDriftPath, stableJson(networkDrift));
    passed.push(
      await expectCode("acquisition-network-policy-drift", "ACQUISITION_NETWORK_POLICY_INVALID", () =>
        promoteSources(root, networkDriftQuarantine, path.join(temporaryRoot, "network-drift-promotion")),
      ),
    );

    const noncanonicalQuarantine = path.join(temporaryRoot, "noncanonical-quarantine");
    await cp(successfulQuarantine, noncanonicalQuarantine, { recursive: true, force: false, errorOnExist: true });
    const noncanonicalPath = path.join(noncanonicalQuarantine, "acquisition.json");
    await writeFile(noncanonicalPath, Buffer.concat([await readFile(noncanonicalPath), Buffer.from("\n")]));
    passed.push(
      await expectCode("noncanonical-acquisition", "ACQUISITION_EVIDENCE_NONCANONICAL", () =>
        promoteSources(root, noncanonicalQuarantine, path.join(temporaryRoot, "noncanonical-promotion")),
      ),
    );

    const tamperedQuarantine = path.join(temporaryRoot, "tampered-quarantine");
    await cp(successfulQuarantine, tamperedQuarantine, { recursive: true, force: false, errorOnExist: true });
    const tamperedPath = path.join(tamperedQuarantine, "files", first.path);
    const tamperedAfterAcquisition = Buffer.from(await readFile(tamperedPath));
    tamperedAfterAcquisition[0] ^= 1;
    await writeFile(tamperedPath, tamperedAfterAcquisition);
    passed.push(
      await expectCode("post-acquisition-tamper", "SOURCE_DIGEST_DRIFT", () =>
        promoteSources(root, tamperedQuarantine, path.join(temporaryRoot, "tampered-promotion")),
      ),
    );

    const missingQuarantine = path.join(temporaryRoot, "missing-quarantine");
    await cp(successfulQuarantine, missingQuarantine, { recursive: true, force: false, errorOnExist: true });
    await rm(path.join(missingQuarantine, "files", first.path));
    passed.push(
      await expectCode("missing-source", "SOURCE_FILE_UNSAFE", () =>
        promoteSources(root, missingQuarantine, path.join(temporaryRoot, "missing-promotion")),
      ),
    );

    return { fixtureCount: passed.length, passed, networkUsed: false, sourceCount: plan.sources.length };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

await main("regulatory-source-negative-fixtures", run);
