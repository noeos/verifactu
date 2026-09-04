// SPDX-License-Identifier: Apache-2.0
import { access, readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { assertProjectRoot, listRepositoryFiles, toPosix } from "./project.mjs";
await assertProjectRoot();
const files = (await listRepositoryFiles()).filter(
  (path) => extname(path) === ".md" && !toPosix(path).startsWith(".github/"),
);
for (const file of files) {
  const source = await readFile(file, "utf8");
  if (source.trim().length === 0 || !/^#\s+.+/mu.test(source))
    throw new Error(`Invalid Markdown document: ${toPosix(file)}`);
  for (const match of source.matchAll(/!?(?:\[[^\]]*\])\(([^)]+)\)/gu)) {
    const target = match[1].split("#", 1)[0];
    if (/^(?:https?:|mailto:)/u.test(target) || target.length === 0) continue;
    try {
      await access(resolve(dirname(file), decodeURIComponent(target)));
    } catch {
      throw new Error(`${toPosix(file)} links to missing path: ${target}`);
    }
  }
}
console.log(`Documentation checks passed for ${files.length} Markdown files.`);
