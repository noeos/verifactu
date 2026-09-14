#!/usr/bin/env node
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, sha256, validateJsonFile } from "../lib/policy.mjs";

export async function prepareExternalInputs(root, outputDirectory = path.join(root, ".cache/admission")) {
  const policy = await validateJsonFile(
    root,
    "config/admission/external-inputs.json",
    "config/admission/external-inputs.schema.json",
  );
  await mkdir(outputDirectory, { recursive: true });
  const evidence = [];
  for (const input of policy.inputs) {
    const response = await fetch(input.url, {
      redirect: "follow",
      headers: { accept: input.mediaType, "user-agent": "noeos-verifactu-admission/1" },
      signal: AbortSignal.timeout(30000),
    });
    assert(response.ok, "DOWNLOAD_FAILED", `${input.id} returned HTTP ${response.status}`);
    assert(response.url.startsWith("https://"), "DOWNLOAD_DOWNGRADE", `${input.id} redirected outside HTTPS`);
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    assert(
      !declaredLength || declaredLength <= input.maximumBytes,
      "DOWNLOAD_TOO_LARGE",
      `${input.id} exceeds its size cap`,
    );
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(bytes.length <= input.maximumBytes, "DOWNLOAD_TOO_LARGE", `${input.id} exceeds its size cap`);
    const digest = sha256(bytes);
    assert(
      digest === input.sha256,
      "DOWNLOAD_DIGEST_MISMATCH",
      `${input.id} expected ${input.sha256}; observed ${digest}`,
    );
    const destination = path.join(outputDirectory, input.filename);
    const temporary = `${destination}.${process.pid}.tmp`;
    await writeFile(temporary, bytes, { mode: 0o600, flag: "wx" });
    await rename(temporary, destination);
    evidence.push({
      id: input.id,
      filename: input.filename,
      bytes: bytes.length,
      sha256: digest,
      finalUrl: response.url,
    });
  }
  return { policyId: policy.policyId, inputCount: evidence.length, inputs: evidence };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("external-input-admission", () => prepareExternalInputs(root));
}
