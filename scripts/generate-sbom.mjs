// SPDX-License-Identifier: Apache-2.0
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, stableJson } from "./project.mjs";
await assertProjectRoot();
const output = resolve(projectRoot, "artifacts/sbom");
await mkdir(output, { recursive: true });
const lock = JSON.parse(
  await (
    await import("node:fs/promises")
  ).readFile(resolve(projectRoot, "package-lock.json"), "utf8"),
);
const components = Object.entries(lock.packages ?? {})
  .filter(([path]) => path !== "")
  .map(([path, item]) => ({ name: item.name ?? path, version: item.version ?? "unknown", path }));
await writeFile(
  resolve(output, "cyclonedx-1.7.json"),
  stableJson({
    bomFormat: "CycloneDX",
    specVersion: "1.7",
    version: 1,
    metadata: {
      component: {
        type: "application",
        name: "@noeos/verifactu-workspace",
        version: "0.0.0-development",
      },
    },
    components,
  }),
);
await writeFile(
  resolve(output, "spdx-3.0.1.json"),
  stableJson({
    spdxVersion: "SPDX-3.0.1",
    name: "@noeos/verifactu-workspace",
    packages: components,
  }),
);
console.log(`SBOM evidence generated for ${components.length} lockfile entries.`);
