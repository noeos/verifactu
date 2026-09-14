#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseTarGzip } from "../build/tar.mjs";
import { assert, main, sha256, validateJsonFile } from "../lib/policy.mjs";

function execute(executable, arguments_, root, temporary) {
  const result = spawnSync(executable, arguments_, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    env: {
      HOME: temporary,
      NO_COLOR: "1",
      PATH: process.env.PATH,
      TMPDIR: temporary,
      TZ: "UTC",
    },
  });
  assert(result.error === undefined, "SECRET_SCANNER_EXECUTION", String(result.error));
  return result;
}

export async function runGitleaks(root) {
  assert(
    process.platform === "linux" && process.arch === "x64",
    "SECRET_SCANNER_PLATFORM",
    "P2 admits the Gitleaks scanner only for Linux x64",
  );
  const policy = await validateJsonFile(
    root,
    "config/admission/external-inputs.json",
    "config/admission/external-inputs.schema.json",
  );
  const distribution = policy.inputs.find(({ id }) => id === "gitleaks-linux-x64-8.30.1");
  const checksumInput = policy.inputs.find(({ id }) => id === "gitleaks-checksums-8.30.1");
  assert(distribution && checksumInput, "SECRET_SCANNER_ADMISSION", "Gitleaks inputs are not admitted");
  const archive = await readFile(path.join(root, ".cache/admission", distribution.filename));
  assert(sha256(archive) === distribution.sha256, "SECRET_SCANNER_DIGEST", "Gitleaks archive digest drifted");
  const checksums = await readFile(path.join(root, ".cache/admission", checksumInput.filename), "utf8");
  const checksumLine = `${distribution.sha256}  gitleaks_8.30.1_linux_x64.tar.gz`;
  assert(
    checksums.split(/\r?\n/).includes(checksumLine),
    "SECRET_SCANNER_PUBLISHER_CHECKSUM",
    "publisher checksum does not bind the admitted archive",
  );
  const entries = parseTarGzip(archive, 32 * 1024 * 1024, null);
  const names = entries.map(({ name }) => name).sort();
  assert(
    JSON.stringify(names) === JSON.stringify(["LICENSE", "README.md", "gitleaks"]),
    "SECRET_SCANNER_ARCHIVE_CONTENT",
    `unexpected Gitleaks archive entries: ${names.join(", ")}`,
  );
  const binary = entries.find(({ name }) => name === "gitleaks");
  const license = entries.find(({ name }) => name === "LICENSE");
  assert(binary?.mode === 0o755, "SECRET_SCANNER_ARCHIVE_MODE", "Gitleaks executable mode must be 0755");
  assert(
    license?.bytes.toString("utf8").includes("MIT License"),
    "SECRET_SCANNER_LICENSE",
    "Gitleaks MIT license is absent",
  );
  const temporary = await mkdtemp(path.join(process.env.RUNNER_TEMP ?? process.env.TMPDIR ?? "/tmp", "gitleaks-"));
  try {
    const executable = path.join(temporary, "gitleaks");
    const report = path.join(temporary, "report.json");
    await writeFile(executable, binary.bytes, { mode: 0o700 });
    const version = execute(executable, ["version"], root, temporary);
    assert(
      version.status === 0 && version.stdout.trim() === "8.30.1",
      "SECRET_SCANNER_VERSION",
      `unexpected Gitleaks version: ${version.stdout.trim()}`,
    );
    const scan = execute(
      executable,
      ["git", "--redact=100", "--no-banner", "--report-format=json", `--report-path=${report}`, root],
      root,
      temporary,
    );
    const findings = JSON.parse(await readFile(report, "utf8").catch(() => "[]"));
    const findingLocations = Array.isArray(findings)
      ? findings.map(({ RuleID, File, Commit, StartLine }) => ({
          ruleId: RuleID,
          file: File,
          commit: Commit,
          line: StartLine,
        }))
      : [];
    assert(
      scan.status === 0,
      "SECRET_SCAN_FINDING",
      `Gitleaks rejected the repository: ${scan.stderr.slice(0, 4000)}${scan.stdout.slice(0, 4000)}`,
      { findings: findingLocations },
    );
    assert(Array.isArray(findings) && findings.length === 0, "SECRET_SCAN_FINDING", "Gitleaks report is not empty");
    return {
      tool: "gitleaks",
      version: "8.30.1",
      archiveSha256: distribution.sha256,
      publisherChecksumVerified: true,
      historyMode: "git",
      findingCount: 0,
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main("gitleaks-secret-scan", () => runGitleaks(root));
}
