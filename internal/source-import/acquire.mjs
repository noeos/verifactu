#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstat, mkdir, open, readFile, rename, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, stableJson, validateJsonFile } from "../../tooling/lib/policy.mjs";
import { assertSafePlan } from "../../tooling/repository/check-regulatory-state.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertMagic(source, bytes) {
  if (source.kind === "pdf") {
    assert(bytes.subarray(0, 5).toString("ascii") === "%PDF-", "SOURCE_MAGIC_MISMATCH", `${source.id} is not PDF`);
    return;
  }
  const prefix = bytes.subarray(0, Math.min(bytes.length, 1024)).toString("utf8").trimStart().toLowerCase();
  if (source.kind === "html") {
    assert(
      prefix.includes("<html") || prefix.startsWith("<!doctype html"),
      "SOURCE_MAGIC_MISMATCH",
      `${source.id} is not HTML`,
    );
    return;
  }
  assert(prefix.startsWith("<?xml") || prefix.startsWith("<"), "SOURCE_MAGIC_MISMATCH", `${source.id} is not XML`);
}

function assertContentType(source, response) {
  const actual = response.headers.get("content-type");
  if (actual === null) {
    assert(["xsd", "wsdl"].includes(source.kind), "SOURCE_CONTENT_TYPE_MISSING", `${source.id} omitted Content-Type`);
    return null;
  }
  const mediaType = actual.split(";", 1)[0].trim().toLowerCase();
  const accepted = new Set(source.accept.split(",").map((value) => value.trim().toLowerCase()));
  assert(accepted.has(mediaType), "SOURCE_CONTENT_TYPE_MISMATCH", `${source.id} returned ${mediaType}`);
  return actual;
}

function optionalHeader(response, name) {
  const value = response.headers.get(name);
  return value === null || value.trim() === "" ? null : value;
}

function assertContentEncoding(source, response) {
  const value = optionalHeader(response, "content-encoding");
  assert(
    value === null || value.toLowerCase() === "identity",
    "SOURCE_CONTENT_ENCODING_FORBIDDEN",
    `${source.id} returned content encoding ${value}`,
  );
  return value;
}

async function streamSource(response, source, temporary) {
  const declared = response.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    assert(
      Number.isSafeInteger(length) && length >= 0,
      "SOURCE_LENGTH_INVALID",
      `${source.id} has invalid Content-Length`,
    );
    assert(length <= source.maximumBytes, "SOURCE_TOO_LARGE", `${source.id} exceeds its declared byte cap`);
  }
  assert(response.body !== null, "SOURCE_BODY_MISSING", `${source.id} has no response body`);
  await mkdir(path.dirname(temporary), { recursive: true });
  const handle = await open(temporary, "wx", 0o600);
  const sha256Hash = createHash("sha256");
  const sha512Hash = createHash("sha512");
  const prefix = [];
  let prefixBytes = 0;
  let total = 0;
  try {
    for await (const chunk of response.body) {
      const bytes = Buffer.from(chunk);
      total += bytes.length;
      assert(total <= source.maximumBytes, "SOURCE_TOO_LARGE", `${source.id} exceeds its streamed byte cap`);
      sha256Hash.update(bytes);
      sha512Hash.update(bytes);
      if (prefixBytes < 1024) {
        const selected = bytes.subarray(0, 1024 - prefixBytes);
        prefix.push(selected);
        prefixBytes += selected.length;
      }
      await handle.writeFile(bytes);
    }
    await handle.sync();
  } catch (error) {
    await handle.close().catch(() => undefined);
    await rm(temporary, { force: true });
    throw error;
  }
  await handle.close();
  assertMagic(source, Buffer.concat(prefix, prefixBytes));
  return { bytes: total, sha256: sha256Hash.digest("hex"), sha512: sha512Hash.digest("hex") };
}

async function writeAtomic(destination, bytes) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, bytes, { flag: "wx", mode: 0o600 });
  await rename(temporary, destination);
}

export async function acquireSources(repositoryRoot, outputDirectory, fetchImpl = globalThis.fetch) {
  const plan = await validateJsonFile(
    repositoryRoot,
    "config/regulatory/source-plan.json",
    "config/regulatory/source-plan.schema.json",
  );
  assertSafePlan(plan);
  assert(
    (await lstat(outputDirectory).catch(() => null)) === null,
    "IMMUTABLE_QUARANTINE_EXISTS",
    "acquisition destinations are append-only",
  );
  const stagingDirectory = `${outputDirectory}.${process.pid}.tmp`;
  const lockPath = `${outputDirectory}.acquire.lock`;
  await mkdir(path.dirname(outputDirectory), { recursive: true });
  assert(
    (await lstat(stagingDirectory).catch(() => null)) === null,
    "ACQUISITION_STAGING_EXISTS",
    "acquisition staging path exists",
  );
  await writeFile(lockPath, `${process.pid}\n`, { flag: "wx", mode: 0o600 }).catch((error) => {
    assert(false, "SOURCE_ACQUISITION_LOCKED", `another acquisition owns the destination: ${error.code}`);
  });
  const allowedOrigins = new Set(plan.allowedOrigins);
  const seenPaths = new Set();
  const observations = [];
  try {
    await mkdir(stagingDirectory, { recursive: false, mode: 0o700 });
    for (const source of plan.sources) {
      const parsed = new URL(source.url);
      assert(
        parsed.username === "" && parsed.password === "" && parsed.hash === "",
        "SOURCE_URL_UNSAFE",
        `${source.id} URL contains credentials or a fragment`,
      );
      assert(allowedOrigins.has(parsed.origin), "SOURCE_ORIGIN_FORBIDDEN", `${source.id} uses ${parsed.origin}`);
      assert(!seenPaths.has(source.path), "SOURCE_PATH_DUPLICATE", `${source.path} is duplicated`);
      seenPaths.add(source.path);
      const response = await fetchImpl(source.url, {
        redirect: "manual",
        headers: {
          accept: source.accept,
          "accept-encoding": "identity",
          "user-agent": "noeos-verifactu-regulatory-import/1",
        },
        signal: AbortSignal.timeout(30_000),
      });
      assert(response.status === 200, "SOURCE_HTTP_STATUS", `${source.id} returned HTTP ${response.status}`);
      assert(response.url === source.url, "SOURCE_REDIRECT_FORBIDDEN", `${source.id} changed URL to ${response.url}`);
      const contentType = assertContentType(source, response);
      const contentEncoding = assertContentEncoding(source, response);
      const destination = path.join(stagingDirectory, "files", source.path);
      const temporary = `${destination}.${process.pid}.part`;
      const streamed = await streamSource(response, source, temporary);
      assert(
        streamed.bytes === source.bytes,
        "SOURCE_LENGTH_DRIFT",
        `${source.id} expected ${source.bytes}; got ${streamed.bytes}`,
      );
      assert(streamed.sha256 === source.sha256, "SOURCE_SHA256_DRIFT", `${source.id} changed SHA-256`);
      assert(streamed.sha512 === source.sha512, "SOURCE_SHA512_DRIFT", `${source.id} changed SHA-512`);
      await rename(temporary, destination);
      observations.push({
        id: source.id,
        requestedUrl: source.url,
        finalUrl: response.url,
        bytes: streamed.bytes,
        sha256: streamed.sha256,
        sha512: streamed.sha512,
        contentType,
        contentEncoding,
        etag: optionalHeader(response, "etag"),
        lastModified: optionalHeader(response, "last-modified"),
      });
    }
    const importerBytes = await readFile(path.join(repositoryRoot, "internal/source-import/acquire.mjs"));
    const manifest = {
      schemaVersion: 1,
      planId: plan.planId,
      planObservedAt: plan.observedAt,
      acquiredAt: new Date().toISOString(),
      runtime: `${process.release.name} ${process.version}`,
      importer: {
        id: "verifactu-regulatory-source-acquisition-v1",
        artifacts: [{ path: "internal/source-import/acquire.mjs", sha256: sha256(importerBytes) }],
      },
      networkPolicy: {
        dns: "runtime-default",
        proxy: "node-fetch-default-no-environment-proxy",
        requestTimeoutMs: 30_000,
        acceptedContentEncoding: "identity-or-absent",
      },
      redirectPolicy: "manual-reject",
      tlsVerification: "runtime-default-required",
      contentTypePolicy: "match-when-present-magic-always",
      sourceCount: observations.length,
      sources: observations,
    };
    await writeAtomic(path.join(stagingDirectory, "acquisition.json"), Buffer.from(stableJson(manifest)));
    assert(
      (await lstat(outputDirectory).catch(() => null)) === null,
      "IMMUTABLE_QUARANTINE_EXISTS",
      "acquisition destination appeared during download",
    );
    await rename(stagingDirectory, outputDirectory);
    return manifest;
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    throw error;
  } finally {
    await unlink(lockPath).catch(() => undefined);
  }
}

const outputIndex = process.argv.indexOf("--output");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(
    outputIndex >= 0 && process.argv[outputIndex + 1],
    "OUTPUT_REQUIRED",
    "use --output with a quarantine directory",
  );
  await main("regulatory-source-acquisition", () =>
    acquireSources(root, path.resolve(root, process.argv[outputIndex + 1])),
  );
}
