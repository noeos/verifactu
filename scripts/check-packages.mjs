// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { assertProjectRoot, projectRoot, run } from "./project.mjs";
await assertProjectRoot();
if (
  !existsSync(`${projectRoot}/packages/verifactu/dist/esm/index.js`) ||
  !existsSync(`${projectRoot}/packages/cli/dist/esm/main.js`)
)
  throw new Error("Build outputs are missing.");
run(process.execPath, [
  "--input-type=module",
  "--eval",
  "import('node:fs/promises').then(async ({readFile}) => { for (const f of ['packages/verifactu/package.json','packages/cli/package.json']) JSON.parse(await readFile(f, 'utf8')); })",
]);
console.log("Package boundary checks passed.");
