---
id: REPO-DOC-0007
title: Local development workflow
status: draft
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0030, ADR-0031, ADR-0033]
historical-inputs: [REV-073, REV-079]
---

# Local development workflow

Start from protected current `main`, a clean worktree and admitted toolchain;
install locked inputs using the canonical safe install task. Create one focused
branch tied to an issue/decision. Modify canonical source, regenerate only via
tasks, add tests/evidence and run the impacted graph plus mandatory governance,
security and package checks.

Before push, run the exact pre-push closure profile, inspect generated/package/
dependency diffs and confirm no secret or personal data. Every commit uses
`git commit -S -s`, a purposeful message and truthful co-author trailers. Push
the branch and open a complete PR with scope, risks, source/ADR/requirement IDs,
test evidence, compatibility/migration and rollback.

CI runs against the final head; amend/rebase invalidates old evidence. Do not
bypass, manually mark checks, rerun-to-green or merge stale work. After every
required context and conversation resolves, native squash is used and the branch
auto-deletes. Read back main ancestry/signature/DCO attribution and checks.

Troubleshooting preserves the first failure and uses diagnostic tasks; it never
changes policies or exclusions incidentally.
