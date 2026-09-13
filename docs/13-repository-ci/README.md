---
id: REPO-INDEX
title: Repository engineering and CI documentation index
status: proposed
authority: informative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [GOV-INDEX, QA-INDEX, SEC-INDEX]
historical-inputs: [REV-063, REV-071, REV-072, REV-073, REV-074, REV-075, REV-076, REV-077, REV-078, REV-079, REV-080, REV-081, REV-082]
---

# Repository engineering and CI

Status: all 22 substantive specifications drafted under `PLAN-L3`; formal
approval and executable repository/CI evidence pending

Authority for the complete future repository layout, placement and ownership of
files, engineering workflow, GitHub configuration, CI workflows and required
jobs. This area must be approved before product source directories are created.
It will define the final protected engineering system, not a temporary bootstrap
or MVP workflow. Local and CI execution must share one deterministic task graph,
and every required check must fail closed for the exact PR commit.

Substantive documents (22):

- `repository-structure.md`
- `directory-and-file-ownership.md`
- `module-boundaries-and-import-rules.md`
- `naming-and-file-conventions.md`
- `generated-vendored-and-temporary-files.md`
- `toolchain.md`
- `local-development-workflow.md`
- `canonical-task-graph.md`
- `git-commits-branches-and-pull-requests.md`
- `ssh-signatures-and-dco.md`
- `single-maintainer-controls.md`
- `github-repository-settings.md`
- `branch-and-tag-rulesets.md`
- `workflow-architecture.md`
- `required-jobs-and-checks.md`
- `workflow-permissions-and-trust.md`
- `untrusted-contributions-and-events.md`
- `caches-artifacts-and-retention.md`
- `dependabot-and-automation.md`
- `policy-as-code.md`
- `github-effective-state-audit.md`
- `bootstrap-and-protection-rollout.md`

`repository-structure.md` will define the whole intended tree, including root
files, workspaces, package internals, generated code, regulatory snapshots,
schemas, vectors, tests, scripts, benchmarks, security material and build
artifacts. It will also define forbidden generic locations such as unscoped
`utils`, `helpers`, `common` or miscellaneous dumping grounds.

The target is squash-only protected `main`, strict required checks, signed
commits, no bypass/force-push/deletion, automatic source-branch deletion and
zero approvals with no `CODEOWNERS`, last-push or unattributed-change approval.
All human branch commits require a verified SSH signature and DCO sign-off. The
approved elaboration contract, desired contexts and trust topology are in
[`PLAN-L3`](../lot-3-assurance-delivery-plan.md).
