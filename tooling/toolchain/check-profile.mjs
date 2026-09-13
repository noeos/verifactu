#!/usr/bin/env node
import { accessSync, constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, main, readJson, validateJsonFile } from "../lib/policy.mjs";

export function assertExecutableResolution(execPath, resolved) {
  const normalize = (value) => path.resolve(value).toLocaleLowerCase("en-US");
  assert(
    normalize(execPath) === normalize(resolved),
    "PATH_SHADOW",
    `node on PATH (${resolved}) is not the executing runtime (${execPath})`,
  );
}

export function assertRuntimeVersions(profileName, profile, nodeVersion, npmVersion) {
  assert(
    nodeVersion === profile.node,
    "NODE_VERSION_DRIFT",
    `profile ${profileName} requires Node ${profile.node}; observed ${nodeVersion}`,
  );
  assert(
    npmVersion === profile.npm,
    "NPM_VERSION_DRIFT",
    `profile ${profileName} requires npm ${profile.npm}; admitted workspace npm is ${npmVersion}`,
  );
}

function resolveNode() {
  const names = process.platform === "win32" ? ["node.exe", "node.cmd", "node"] : ["node"];
  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    for (const name of names) {
      const candidate = path.resolve(directory, name);
      try {
        accessSync(candidate, constants.X_OK);
        return candidate;
      } catch (error) {
        void error;
      }
    }
  }
  return "<unresolved>";
}

export async function checkProfile(root, profileName = "node-24-primary", enforceEnvironment = false) {
  const policy = await validateJsonFile(
    root,
    "config/toolchain/profiles.json",
    "config/toolchain/profiles.schema.json",
  );
  if (profileName === "auto") {
    const observedNode = process.version.replace(/^v/, "");
    profileName = Object.entries(policy.profiles).find(
      ([, candidate]) => candidate.status === "required" && candidate.node === observedNode,
    )?.[0];
    assert(profileName, "NODE_VERSION_DRIFT", `Node ${observedNode} is not a required toolchain profile`);
  }
  const profile = policy.profiles[profileName];
  assert(profile, "UNKNOWN_TOOLCHAIN_PROFILE", `unknown profile ${profileName}`);
  const nodeVersion = process.version.replace(/^v/, "");
  assertExecutableResolution(process.execPath, resolveNode());
  const npmManifest = await readJson(path.join(root, "node_modules/npm/package.json"));
  assertRuntimeVersions(profileName, profile, nodeVersion, npmManifest.version);
  const typescriptManifest = await readJson(path.join(root, "node_modules/typescript/package.json"));
  assert(
    typescriptManifest.version === policy.typescript.version,
    "TYPESCRIPT_VERSION_DRIFT",
    `TypeScript must be ${policy.typescript.version}`,
  );
  if (enforceEnvironment) {
    const expected = policy.environment;
    assert(process.env.TZ === expected.timezone, "ENVIRONMENT_DRIFT", `TZ must be ${expected.timezone}`);
    assert(
      process.env.LANG === expected.locale && process.env.LC_ALL === expected.locale,
      "ENVIRONMENT_DRIFT",
      `LANG and LC_ALL must be ${expected.locale}`,
    );
    assert(
      process.env.SOURCE_DATE_EPOCH === expected.sourceDateEpoch,
      "ENVIRONMENT_DRIFT",
      `SOURCE_DATE_EPOCH must be ${expected.sourceDateEpoch}`,
    );
  }
  return {
    policyId: policy.policyId,
    profile: profileName,
    status: profile.status,
    node: nodeVersion,
    npm: npmManifest.version,
    typescript: typescriptManifest.version,
    executable: process.execPath,
    pathResolution: resolveNode(),
    environmentEnforced: enforceEnvironment,
    nodeArchiveDigests: profile.assets,
    npmIntegrity: policy.npmDistributions[profile.npm].integrity,
  };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const profileIndex = process.argv.indexOf("--profile");
  const profile = profileIndex >= 0 ? process.argv[profileIndex + 1] : "node-24-primary";
  await main("toolchain-profile", () => checkProfile(root, profile, process.argv.includes("--enforce-environment")));
}
