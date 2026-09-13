---
id: REPO-DOC-0022
title: Bootstrap and protection rollout
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0004, ADR-0031, ADR-0033]
historical-inputs: [REV-075, REV-076, REV-077, REV-078]
---

# Bootstrap and protection rollout

Bootstrap is a one-time governance operation, not a reusable bypass. From the
current empty-history state, create the smallest SSH-signed and DCO-signed
documentation/tooling commit, push its branch, run initially non-required checks,
then configure Actions/security/settings and main ruleset from reviewed desired
state using least-privileged administration.

Order is: authenticate owner/key; create/read repository baseline; push trusted
workflows; observe each exact context/producer; enable full-SHA Action policy;
enable strict required contexts/no-bypass ruleset; read back all endpoints; prove
direct/force/delete/unsigned pushes fail; prove protected PR squash succeeds and
branch deletes; archive redacted evidence.

Any temporary relaxation has exact start/end, fields, actor, reason and expiry,
contains no product code and is removed/read back before normal development.
Failure stops before proceeding; rollback restores the last verified safer state,
not an open main branch.

After closure, all changes—including this documentation's formal acceptance—use
the protected path. Emergency recovery is governed later and cannot be inferred
from bootstrap credentials.
