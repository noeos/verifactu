// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { assertProjectRoot, npmCliPath, run } from "./project.mjs";

await assertProjectRoot();
const first = await packSnapshot();
const second = await packSnapshot();
if (JSON.stringify(first) !== JSON.stringify(second))
  throw new Error("Package operations are not reproducible.");
console.log("Package reproducibility checks passed.");

async function packSnapshot() {
  const destination = await mkdtemp(resolve(tmpdir(), "noeos-verifactu-pack-"));
  try {
    const result = {};
    for (const workspace of ["@noeos/verifactu", "@noeos/verifactu-cli"]) {
      const workspaceDestination = resolve(destination, workspace.split("/").pop());
      await mkdir(workspaceDestination, { recursive: true });
      run(process.execPath, [
        npmCliPath(),
        "pack",
        "--silent",
        "--ignore-scripts",
        "--pack-destination",
        workspaceDestination,
        "--workspace",
        workspace,
      ]);
      const archive = (await readdir(workspaceDestination)).find((name) => name.endsWith(".tgz"));
      if (archive === undefined) throw new Error(`No archive produced for ${workspace}`);
      result[workspace] = createHash("sha256")
        .update(await readFile(resolve(workspaceDestination, archive)))
        .digest("hex");
    }
    return result;
  } finally {
    await rm(destination, { force: true, recursive: true });
  }
}
