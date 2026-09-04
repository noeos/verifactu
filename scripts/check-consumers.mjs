// SPDX-License-Identifier: Apache-2.0
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot } from "./project.mjs";
await assertProjectRoot();
const esm = await import(`file://${resolve(projectRoot, "packages/verifactu/dist/esm/index.js")}`);
const require = createRequire(import.meta.url);
const common = require(resolve(projectRoot, "packages/verifactu/dist/cjs/index.js"));
if (Object.keys(esm).length !== 0 || Object.keys(common).length !== 0)
  throw new Error("Foundation API is not empty.");
await import(`file://${resolve(projectRoot, "packages/cli/dist/esm/main.js")}`);
console.log("Clean consumer checks passed.");
