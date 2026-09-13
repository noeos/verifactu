---
id: ADR-0033
title: Required leaf checks and fail-closed closure
status: accepted
authority: decision
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0026, ADR-0030, ADR-0031]
sources: [SRC-0053]
historical-inputs: [REV-056, REV-058, REV-063, REV-076, REV-079]
---

# ADR-0033: Required leaf checks and fail-closed closure

## Decision

Rulesets require stable security-meaningful leaf contexts and one closure job.
Each context records expected GitHub App/workflow producer, trigger coverage,
matrix identity, report schema and exact head SHA. The closure job runs with
`if: always()` and succeeds only when every declared prerequisite succeeded and
every report is present, valid, non-empty and subject-matched.

Leaf contexts remain required so deleting or weakening the aggregator cannot
hide them. Closure remains required so partial matrices, dynamically omitted
jobs and missing artifacts cannot look complete. Cancelled, skipped, neutral,
timed-out, absent and unknown results fail unless a named applicability rule
independently demonstrates `not-applicable`.

## Alternatives and consequences

Leaf-only cannot prove set closure; aggregate-only is a single removable mask.
The combined design adds context management and requires careful rename
migration. A required-check registry and pre-change dual-run preserve continuity.

## Verification

Synthetic workflow fixtures omit, rename, skip, cancel and spoof producers or
SHAs. API audit paginates all rules and checks actual producer binding after the
first trusted run.
