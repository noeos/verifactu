---
id: QA-DOC-0017
title: Flakiness and infrastructure failures
status: draft
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0028, ADR-0033]
historical-inputs: [REV-059, REV-060, REV-079]
---

# Flakiness and infrastructure failures

The first required attempt is immutable evidence. Failures classify as product,
test/harness, runner/tool, external dependency or unresolved; classification
never changes failure into pass. Diagnostic reruns use the same subject and
record both attempts, seed/schedule and environmental delta.

Quarantine requires finding, affected claims, owner, expiry/SLA and compensating
gate. Quarantined work is excluded visibly from satisfaction and critical/
regulatory/security/public-contract tests block merge/release until restored.
Retry budgets are bounded and reserved for explicitly recognizable platform
transport faults, never assertion, timeout or unknown errors.

Trend reports measure first-attempt failure and recurrence, not eventual green.
Chaos fixtures prove retry cannot mask failure; runner outage produces
`blocked`, preserves partial artifacts and cannot satisfy closure.
