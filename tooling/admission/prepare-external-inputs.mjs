#!/usr/bin/env node
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, sha256, validateJsonFile } from "../lib/policy.mjs";

const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_DOWNLOAD_ATTEMPTS = 3;

async function discardResponse(response) {
  try {
    await response.body?.cancel();
  } catch {
    // The response is already unusable; cancellation is best-effort cleanup only.
  }
}

function redactedFinalUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  return `${parsed.origin}${parsed.pathname}`;
}

export async function downloadAdmittedInput(
  input,
  {
    fetchImpl = globalThis.fetch,
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  } = {},
) {
  for (let attempt = 1; attempt <= MAX_DOWNLOAD_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(input.url, {
        redirect: "follow",
        headers: { accept: input.mediaType, "user-agent": "noeos-verifactu-admission/1" },
        signal: AbortSignal.timeout(30000),
      });
    } catch (error) {
      if (attempt < MAX_DOWNLOAD_ATTEMPTS) {
        await sleep(500 * 2 ** (attempt - 1));
        continue;
      }
      assert(false, "DOWNLOAD_FAILED", `${input.id} exhausted ${attempt} attempts: ${String(error)}`);
    }

    if (!response.ok) {
      const retryable = RETRYABLE_HTTP_STATUS.has(response.status);
      await discardResponse(response);
      if (retryable && attempt < MAX_DOWNLOAD_ATTEMPTS) {
        await sleep(500 * 2 ** (attempt - 1));
        continue;
      }
      assert(
        false,
        "DOWNLOAD_FAILED",
        `${input.id} returned HTTP ${response.status} after ${attempt} attempt${attempt === 1 ? "" : "s"}`,
      );
    }

    if (!response.url.startsWith("https://")) {
      await discardResponse(response);
      assert(false, "DOWNLOAD_DOWNGRADE", `${input.id} redirected outside HTTPS`);
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength && declaredLength > input.maximumBytes) {
      await discardResponse(response);
      assert(false, "DOWNLOAD_TOO_LARGE", `${input.id} exceeds its size cap`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(bytes.length <= input.maximumBytes, "DOWNLOAD_TOO_LARGE", `${input.id} exceeds its size cap`);
    const digest = sha256(bytes);
    assert(
      digest === input.sha256,
      "DOWNLOAD_DIGEST_MISMATCH",
      `${input.id} expected ${input.sha256}; observed ${digest}`,
    );
    return {
      bytes,
      digest,
      attemptCount: attempt,
      finalUrl: redactedFinalUrl(response.url),
    };
  }
  assert(false, "DOWNLOAD_FAILED", `${input.id} reached an impossible retry state`);
}

export async function prepareExternalInputs(root, outputDirectory = path.join(root, ".cache/admission")) {
  const policy = await validateJsonFile(
    root,
    "config/admission/external-inputs.json",
    "config/admission/external-inputs.schema.json",
  );
  await mkdir(outputDirectory, { recursive: true });
  const evidence = [];
  for (const input of policy.inputs) {
    const download = await downloadAdmittedInput(input);
    const destination = path.join(outputDirectory, input.filename);
    const temporary = `${destination}.${process.pid}.tmp`;
    await writeFile(temporary, download.bytes, { mode: 0o600, flag: "wx" });
    await rename(temporary, destination);
    evidence.push({
      id: input.id,
      filename: input.filename,
      bytes: download.bytes.length,
      sha256: download.digest,
      attemptCount: download.attemptCount,
      finalUrl: download.finalUrl,
    });
  }
  return { policyId: policy.policyId, inputCount: evidence.length, inputs: evidence };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("external-input-admission", () => prepareExternalInputs(root));
}
