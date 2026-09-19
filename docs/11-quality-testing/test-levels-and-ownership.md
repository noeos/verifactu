---
id: QA-DOC-0003
title: Test levels and ownership
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026]
---

# Test levels and ownership

| Level | Required subject | Prohibited substitute |
|---|---|---|
| Unit/property | Pure module and invariants | Only exported barrel smoke |
| Contract | Public schema/API/port and provider error algebra | Internal implementation assertion |
| Integration | Real compiled packages plus owned resources/processes | Workspace source alias |
| E2E | Installed library/CLI/kit through complete host scenario | Permanent fake of claimed boundary |
| External | Named AEAT/provider environment and observation date | Deterministic general compatibility claim |

The module owner authors unit obligations; contract owner owns consumer/provider
fixtures; integration owner owns cross-component scenarios; quality-owner owns
meta-assurance and closure. Security/performance owners approve their specialised
methods. One test MAY support several claims only when each assertion/result is
independently reported.

Every defect is first reproduced at the highest faithful level, then minimized
without deleting the original regression. Ownership includes repair SLA,
fixture maintenance, supported matrix and diagnostic quality; “belongs to CI”
is not a valid owner.
