// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from "node:child_process";
import { assertProjectRoot, projectRoot } from "./project.mjs";
await assertProjectRoot();
if (process.env.NOEOS_BASE_SHA === undefined || process.env.NOEOS_HEAD_SHA === undefined) {
  console.log("DCO range not configured; skipped outside pull requests.");
  process.exit(0);
}
const output = execFileSync(
  "git",
  [
    "log",
    "--format=%H%x1f%an%x1f%ae%x1f%B%x1e",
    `${process.env.NOEOS_BASE_SHA}..${process.env.NOEOS_HEAD_SHA}`,
  ],
  { cwd: projectRoot, encoding: "utf8" },
);
for (const record of output.split("\x1e")) {
  const [sha, name, email, ...message] = record.trim().split("\x1f");
  if (
    sha !== undefined &&
    sha.length > 0 &&
    !message
      .join("\x1f")
      .split(/\r?\n/u)
      .some((line) => line === `Signed-off-by: ${name} <${email}>`)
  )
    throw new Error(`Commit missing DCO sign-off: ${sha}`);
}
console.log("DCO sign-off verified.");
