import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = fileURLToPath(new URL("../../", import.meta.url));
const npmRoot = process.env.VERIFACTU_NPM_ROOT ?? join(root, "node_modules");
const npmCli = join(npmRoot, "npm/bin/npm-cli.js");
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    env: {
      ...process.env,
      npm_config_offline: "true",
      npm_config_ignore_scripts: "true",
    },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
};
const runNpm = (args, cwd) => run(process.execPath, [npmCli, ...args], cwd);

test("packed package installs into an isolated offline consumer", async (t) => {
  const temp = await mkdtemp(join(tmpdir(), "verifactu-p4-consumer-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const packageRoot = join(root, "packages/verifactu");
  const staged = join(temp, "package");
  await mkdir(staged);
  await cp(
    join(root, "evidence/runs/artifacts/build/verifactu/dist"),
    join(staged, "dist"),
    { recursive: true },
  );
  for (const file of ["package.json", "LICENSE", "NOTICE", "README.md"])
    await cp(join(packageRoot, file), join(staged, file));
  const packed = JSON.parse(
    runNpm(["pack", "--json", "--pack-destination", temp], staged),
  );
  assert.equal(packed.length, 1);
  const tarball = join(temp, packed[0].filename);
  const runtimeRoot = join(temp, "runtime");
  await mkdir(runtimeRoot);
  const runtimeTarballs = [];
  for (const name of [
    "@noeos/verification-engine",
    "@nuintun/qrcode",
    "tslib",
  ]) {
    const runtimePackage = join(root, "node_modules", ...name.split("/"));
    const runtimePack = JSON.parse(
      runNpm(
        ["pack", "--json", "--pack-destination", runtimeRoot],
        runtimePackage,
      ),
    );
    assert.equal(runtimePack.length, 1);
    runtimeTarballs.push(join(runtimeRoot, runtimePack[0].filename));
  }
  const consumer = join(temp, "consumer");
  await mkdir(consumer);
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify({ name: "p4-consumer", private: true, type: "module" }),
  );
  runNpm(
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      tarball,
      ...runtimeTarballs,
    ],
    consumer,
  );
  const manifest = JSON.parse(
    await readFile(
      join(consumer, "node_modules/@noeos/verifactu/package.json"),
      "utf8",
    ),
  );
  assert.deepEqual(Object.keys(manifest.exports), ["."]);
  run(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "const api = await import('@noeos/verifactu'); if (Object.keys(api).length !== 0) process.exit(1)",
    ],
    consumer,
  );
});
