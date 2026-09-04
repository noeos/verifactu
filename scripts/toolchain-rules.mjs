// SPDX-License-Identifier: Apache-2.0
import { resolve, dirname, win32 } from "node:path";
import { projectRoot, readJson } from "./project.mjs";
const manifest = await readJson(resolve(projectRoot, "security/runtime-toolchain.json"));
export function getProfile(name) {
  const profile = manifest.profiles[name];
  if (profile === undefined) throw new Error(`Unknown runtime profile: ${name}`);
  return profile;
}
export function bundledNpmManifestPath(nodeExecutable, platform = process.platform) {
  return platform === "win32"
    ? win32.resolve(win32.dirname(nodeExecutable), "node_modules", "npm", "package.json")
    : resolve(dirname(nodeExecutable), "..", "lib", "node_modules", "npm", "package.json");
}
export function bundledNpmCliPath(nodeExecutable, platform = process.platform) {
  const path = platform === "win32" ? win32 : { resolve, dirname };
  return platform === "win32"
    ? path.resolve(path.dirname(nodeExecutable), "node_modules", "npm", "bin", "npm-cli.js")
    : path.resolve(
        path.dirname(nodeExecutable),
        "..",
        "lib",
        "node_modules",
        "npm",
        "bin",
        "npm-cli.js",
      );
}
