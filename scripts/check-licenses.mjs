// SPDX-License-Identifier: Apache-2.0
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot } from "./project.mjs";
await assertProjectRoot();
for (const file of [
  "LICENSE",
  "NOTICE",
  "CONTRIBUTING.md",
  "packages/verifactu/package.json",
  "packages/cli/package.json",
])
  await access(resolve(projectRoot, file));
for (const file of ["packages/verifactu/src/index.ts", "packages/cli/src/main.ts"])
  if (
    !(await readFile(resolve(projectRoot, file), "utf8")).includes(
      "SPDX-License-Identifier: Apache-2.0",
    )
  )
    throw new Error(`Missing SPDX header: ${file}`);
console.log("License and attribution checks passed.");
