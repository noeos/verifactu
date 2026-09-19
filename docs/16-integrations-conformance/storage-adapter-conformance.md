---
id: INTEGRATION-DOC-0009
title: Storage adapter conformance
status: approved
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0023, ADR-0038]
historical-inputs: [REV-028, REV-032, REV-033, REV-060, REV-061]
---

# Storage adapter conformance

Levels are explicitly `ephemeral-test`, `durable-single-process`, `durable-
concurrent` and `host-atomic`; higher levels include lower requirements. Claims
cover constraints/uniqueness, transaction/isolation, CAS/expected head, fencing/
leases, idempotency, outbox claiming, durable artifacts and bounded pagination.

The kit provisions a disposable namespace, probes capabilities, executes real
concurrent processes and kills them at registered fault points. Independent SQL/
backend inspection validates durable state after restart; API self-report alone
is insufficient. Empty adapter or zero executed capability fails.

Schema/version/migration, backup/restore and cleanup are part of claimed level.
Timeout/deadlock/conflict/connection-loss/unknown commit map to exact results.
Credentials are least-privileged/ephemeral, destructive endpoints allowlisted and
production markers rejected.
