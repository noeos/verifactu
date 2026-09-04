// SPDX-License-Identifier: Apache-2.0
import { bundledNpmCliPath, getProfile } from "./toolchain-rules.mjs";
import { assertProjectRoot, run } from "./project.mjs";
await assertProjectRoot();
const profileIndex = process.argv.indexOf("--profile");
if (profileIndex < 0 || process.argv[profileIndex + 1] === undefined)
  throw new Error("Usage: run-verified-package-manager --profile <profile> -- <npm args>");
const profile = getProfile(process.argv[profileIndex + 1]);
const separator = process.argv.indexOf("--", profileIndex + 2);
if (separator < 0) throw new Error("npm arguments must follow --");
if (process.versions.node !== profile.node)
  throw new Error(`Node ${profile.node} required; found ${process.versions.node}`);
run(process.execPath, [bundledNpmCliPath(process.execPath), ...process.argv.slice(separator + 1)], {
  env: { ...process.env, npm_config_ignore_scripts: "true", npm_config_omit: "optional" },
});
