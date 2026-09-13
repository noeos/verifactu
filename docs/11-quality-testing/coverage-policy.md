---
id: QA-DOC-0010
title: Coverage policy
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0027]
historical-inputs: [REV-056]
---

# Coverage policy

Instrumentation includes every production module of every public package and
CLI, including modules not imported by tests. Generated official structure is
reported separately; handwritten semantic overlays remain in the production
denominator. Tests, declarations, generated reports and fixtures are excluded.

Each public package MUST reach at least 98% lines, 98% functions and 95% branches.
Registered critical fiscal/signature/atomicity/state/correlation code requires
100% branch/condition coverage unless unreachable code is removed. Repository
aggregation cannot hide a package below threshold.

An exclusion needs immutable ID, exact path/span, reason, risk, owner and review/
expiry; broad globs and “hard to test” are invalid. Coverage supports gap
discovery but never replaces assertions or mutation.

CI validates tool/config/source inventory, non-empty maps and report schema and
adds a deliberately untested production module in a negative fixture to prove
the denominator falls.
