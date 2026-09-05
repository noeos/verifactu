// SPDX-License-Identifier: Apache-2.0
import { cp, copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, run, stableJson } from "./project.mjs";

await assertProjectRoot();
const generated = [
  ".build",
  "packages/verifactu/dist",
  "packages/cli/dist",
  "packages/adapter-kit/dist",
  "packages/verifactu/temp",
  "packages/cli/temp",
  "packages/adapter-kit/temp",
].map((item) => resolve(projectRoot, item));
for (const target of generated) await rm(target, { force: true, recursive: true });
if (process.argv.includes("--clean-only")) process.exit(0);
const compiler = resolve(projectRoot, "node_modules/typescript/bin/tsc");
run(process.execPath, [compiler, "--project", "packages/verifactu/tsconfig.esm.json"]);
run(process.execPath, [compiler, "--project", "packages/verifactu/tsconfig.cjs.json"]);
run(process.execPath, [compiler, "--project", "packages/cli/tsconfig.json"]);
run(process.execPath, [compiler, "--project", "packages/adapter-kit/tsconfig.json"]);
await mkdir(resolve(projectRoot, "packages/verifactu/dist/cjs"), { recursive: true });
await writeFile(
  resolve(projectRoot, "packages/verifactu/dist/cjs/package.json"),
  stableJson({ type: "commonjs" }),
);
for (const packageName of ["verifactu", "cli", "adapter-kit"]) {
  await copyFile(
    resolve(projectRoot, "LICENSE"),
    resolve(projectRoot, `packages/${packageName}/LICENSE`),
  );
  await copyFile(
    resolve(projectRoot, "NOTICE"),
    resolve(projectRoot, `packages/${packageName}/NOTICE`),
  );
}
const edition = (await import("../regulatory/sources.json", { with: { type: "json" } })).default
  .edition;
await cp(
  resolve(projectRoot, `contracts/editions/${edition}`),
  resolve(projectRoot, `packages/verifactu/dist/contracts/${edition}`),
  { recursive: true },
);
await cp(resolve(projectRoot, "vectors"), resolve(projectRoot, "packages/verifactu/dist/vectors"), {
  recursive: true,
});
