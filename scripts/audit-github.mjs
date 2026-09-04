// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, readJson } from "./project.mjs";
await assertProjectRoot();
const expected = await readJson(resolve(projectRoot, "security/github-settings.json"));
const actual = JSON.parse(
  execFileSync("gh", ["api", `repos/${expected.repository}`], { encoding: "utf8" }),
);
const failures = [];
for (const [label, value, wanted] of [
  ["visibility", actual.visibility, expected.visibility],
  ["default branch", actual.default_branch, expected.defaultBranch],
  ["issues", actual.has_issues, expected.features.issues],
  ["wiki", actual.has_wiki, expected.features.wiki],
  ["projects", actual.has_projects, expected.features.projects],
  ["discussions", actual.has_discussions, expected.features.discussions],
  ["squash", actual.allow_squash_merge, expected.merge.allowSquashMerge],
  ["merge commits", actual.allow_merge_commit, expected.merge.allowMergeCommit],
  ["rebase", actual.allow_rebase_merge, expected.merge.allowRebaseMerge],
  ["auto merge", actual.allow_auto_merge, expected.merge.allowAutoMerge],
  ["delete branch", actual.delete_branch_on_merge, expected.deleteBranchOnMerge],
])
  if (value !== wanted) failures.push(`${label}: expected ${wanted}, found ${value}`);
if (failures.length > 0) throw new Error(failures.join("\n"));
console.log(`GitHub metadata verified for ${expected.repository}.`);
