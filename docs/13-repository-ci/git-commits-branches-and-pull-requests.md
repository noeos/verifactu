---
id: REPO-DOC-0009
title: Git commits, branches and pull requests
status: approved
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0004, ADR-0031]
historical-inputs: [REV-073, REV-077, REV-079]
---

# Git commits, branches and pull requests

Branches use `<type>/<work-id>-<short-scope>` with `feat`, `fix`, `docs`, `refactor`,
`test`, `build`, `ci`, `security` or `chore`. Each branch/PR has one coherent
objective; unrelated changes split. Commits are reviewable, buildable where
practicable, imperative and identify the governing work item.

Every commit in the PR range is allowed-signature verified and DCO-valid. Fixup/
merge commits, unsigned rewritten history and commits outside the computed merge
base range fail. Rebase onto current main is allowed before final validation;
force updates invalidate approvals/evidence even though approvals are zero.

PR templates require change/omission, claim IDs, legal/security/privacy/
performance/compatibility impact, generated/dependency changes, exact commands,
evidence links and rollback. Draft PRs cannot merge. Conversations resolve only
after code/evidence or explicit recorded disposition.

Merge is native squash only. The squash title/body retain PR/work identity and
DCO attribution; main ancestry has exactly one new verified commit. GitHub
auto-deletes the source branch after successful merge.
