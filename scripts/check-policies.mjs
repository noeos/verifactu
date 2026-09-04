// SPDX-License-Identifier: Apache-2.0
import { extname, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import {
  assertProjectRoot,
  listRepositoryFiles,
  projectRoot,
  readJson,
  toPosix,
} from "./project.mjs";
await assertProjectRoot();
const root = await readJson(resolve(projectRoot, "package.json"));
const verifactu = await readJson(resolve(projectRoot, "packages/verifactu/package.json"));
const cli = await readJson(resolve(projectRoot, "packages/cli/package.json"));
const lock = await readJson(resolve(projectRoot, "package-lock.json"));
const actions = await readJson(resolve(projectRoot, "security/workflow-actions.json"));
const inventory = await readJson(resolve(projectRoot, "security/dependency-inventory.json"));
if (root.packageManager !== "npm@11.19.0" || lock.lockfileVersion !== 3 || root.private !== true)
  throw new Error("Workspace/toolchain policy failed.");
if (
  verifactu.private !== true ||
  cli.private !== true ||
  verifactu.version !== cli.version ||
  verifactu.dependencies["@noeos/verification-engine"] !== "1.0.1" ||
  cli.dependencies["@noeos/verifactu"] !== verifactu.version
)
  throw new Error("Package boundary policy failed.");
if (
  inventory.generatedFrom !== "package-lock.json" ||
  !/^[a-f0-9]{64}$/u.test(inventory.lockfileSha256)
)
  throw new Error("Dependency inventory policy failed.");
const signer = await readFile(resolve(projectRoot, "security/allowed-signers"), "utf8");
if (
  !/^ddcandales@gmail\.com namespaces="git" ssh-ed25519 [A-Za-z0-9+/]+={0,2}/u.test(signer.trim())
)
  throw new Error("Release signing policy failed.");
const files = await listRepositoryFiles();
for (const file of files) {
  const path = toPosix(file);
  if (/(?:^|\/)(?:common|helpers|misc|utils)\.(?:ts|js|mjs|cjs)$/u.test(path))
    throw new Error(`Ambiguous source filename: ${path}`);
  if (extname(file) === ".pdf" || path === "LICENSE") continue;
  const source = await readFile(file, "utf8");
  if (
    !path.startsWith("docs/") &&
    !path.startsWith("scripts/check-policies.mjs") &&
    !path.startsWith("scripts/check-regulatory-manifest.mjs") &&
    /\b(?:TODO|FIXME|PLACEHOLDER)\b/u.test(source)
  )
    throw new Error(`Unresolved marker: ${path}`);
  const tokenPattern = new RegExp(
    "(?:npm_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|ghp_[A-Za-z0-9]{30,})",
    "u",
  );
  if (
    path !== "scripts/check-policies.mjs" &&
    (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u.test(source) ||
      tokenPattern.test(source)) &&
    path !== "security/allowed-signers"
  )
    throw new Error(`Possible secret: ${path}`);
}
for (const workflow of files.filter((file) => toPosix(file).startsWith(".github/workflows/"))) {
  const source = await readFile(workflow, "utf8");
  if (
    /pull_request_target|write-all/u.test(source) ||
    /(^|[ \t])npm[ \t]+(?:install|ci|run|publish)/mu.test(source)
  )
    throw new Error(`Workflow policy failed: ${toPosix(workflow)}`);
  if (
    [...source.matchAll(/^\s*uses:\s*actions\/checkout@/gmu)].length !==
    [...source.matchAll(/persist-credentials:\s*false/gmu)].length
  )
    throw new Error(`Checkout credentials not disabled: ${toPosix(workflow)}`);
}
const workflowSources = await Promise.all(
  files
    .filter((file) => toPosix(file).startsWith(".github/workflows/"))
    .map((file) => readFile(file, "utf8")),
);
const usedActions = new Set(
  workflowSources.flatMap((source) =>
    [...source.matchAll(/^\s*uses:\s*([^\s#]+)/gmu)].map((match) => match[1]),
  ),
);
const reviewedActions = new Set((actions.actions ?? []).map(({ reference }) => reference));
for (const reference of usedActions) {
  if (!reviewedActions.has(reference) && !reference.startsWith("./"))
    throw new Error(`Action missing from reviewed inventory: ${reference}`);
}
for (const reference of reviewedActions)
  if (!usedActions.has(reference)) throw new Error(`Reviewed action is unused: ${reference}`);
console.log(`Repository policy passed for ${files.length} files.`);
