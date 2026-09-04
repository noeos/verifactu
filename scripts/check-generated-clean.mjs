// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from "node:child_process";
import { assertProjectRoot, projectRoot } from "./project.mjs";

await assertProjectRoot();
const paths = [
  "contracts",
  "packages/verifactu/etc/verifactu.api.md",
  "packages/verifactu/src/generated",
];
const output = execFileSync(
  "git",
  ["status", "--porcelain=v1", "--untracked-files=all", "--", ...paths],
  {
    cwd: projectRoot,
    encoding: "utf8",
  },
);
if (output.length !== 0) {
  throw new Error(`Generated artifacts are stale or untracked:\n${output}`);
}
console.log("Generated artifacts match the reviewed repository state.");
