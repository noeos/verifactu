#!/usr/bin/env node
import { createGunzip } from "node:zlib";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";
import process from "node:process";
import { assert, readJson, run, sha256 } from "../lib/core.mjs";

const separator = process.argv.indexOf("--");
const toolIndex = process.argv.indexOf("--tool");
assert(
  toolIndex >= 0 && process.argv[toolIndex + 1],
  "TOOL_ARGUMENT",
  "--tool",
);
const id = process.argv[toolIndex + 1];
const args = separator >= 0 ? process.argv.slice(separator + 1) : [];
const manifest = await readJson(
  resolve("config/admission/external-tools.json"),
);
const record = manifest.tools.find(
  (entry) => entry.id === id && entry.platform === "linux-x64",
);
assert(record, "TOOL_UNADMITTED", id);
assert(
  process.platform === "linux" && process.arch === "x64",
  "TOOL_PLATFORM",
  `${process.platform}-${process.arch}`,
);
const root = await mkdtemp(resolve(tmpdir(), `verifactu-${id}-`));
try {
  const response = await fetch(record.url, {
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  assert(
    response.ok,
    "TOOL_DOWNLOAD_HTTP",
    `${new URL(record.url).origin}${new URL(record.url).pathname}: ${response.status}`,
  );
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.length <= record.maximumBytes, "TOOL_DOWNLOAD_SIZE", id);
  assert(sha256(bytes) === record.sha256, "TOOL_DOWNLOAD_DIGEST", id);
  let executableBytes = bytes;
  if (record.url.endsWith(".tar.gz")) {
    const chunks = [];
    const stream = (await import("node:stream")).Readable.from(bytes).pipe(
      createGunzip(),
    );
    for await (const chunk of stream) chunks.push(chunk);
    const tar = Buffer.concat(chunks);
    let offset = 0;
    executableBytes = null;
    while (offset + 512 <= tar.length) {
      const header = tar.subarray(offset, offset + 512);
      if (header.every((byte) => byte === 0)) break;
      const text = (start, length) =>
        header
          .subarray(start, start + length)
          .toString("utf8")
          .replace(/\0.*$/su, "");
      const name = text(0, 100);
      const size = Number.parseInt(text(124, 12).trim() || "0", 8);
      const type = text(156, 1) || "0";
      assert(
        !name.startsWith("/") && !name.split("/").includes(".."),
        "TOOL_ARCHIVE_PATH",
        name,
      );
      assert(
        ["0", "5"].includes(type),
        "TOOL_ARCHIVE_TYPE",
        `${name}: ${type}`,
      );
      if (type === "0" && basename(name) === record.executable) {
        assert(
          executableBytes === null,
          "TOOL_ARCHIVE_DUPLICATE",
          record.executable,
        );
        executableBytes = tar.subarray(offset + 512, offset + 512 + size);
      }
      offset += 512 + Math.ceil(size / 512) * 512;
    }
    assert(executableBytes, "TOOL_ARCHIVE_MISSING", record.executable);
  }
  const executable = resolve(root, record.executable);
  await writeFile(executable, executableBytes, { mode: 0o500 });
  const version = await run(
    executable,
    [id === "osv-scanner" ? "--version" : "version"],
    {
      cwd: process.cwd(),
      timeoutMs: 30000,
    },
  );
  assert(
    version.code === 0 &&
      `${version.stdout}${version.stderr}`.includes(record.version),
    "TOOL_IDENTITY",
    `${version.stdout}${version.stderr}`.trim(),
  );
  const result = await run(executable, args, {
    cwd: process.cwd(),
    timeoutMs: 300000,
    maxBuffer: 64 * 1024 * 1024,
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.code;
} finally {
  await rm(root, { recursive: true, force: true });
}
