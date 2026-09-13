---
id: QA-DOC-0009
title: Mutation testing
status: draft
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0065]
decisions: [ADR-0027]
historical-inputs: [REV-056, REV-057]
---

# Mutation testing

Mutation MUST alter compiled production semantics, never merely enumerate text.
The registered critical catalogue targets fiscal decisions, field ordering and
encoding, signature/digest verification, state guards, CAS/fencing, atomicity,
retry/correlation, authorization, limits and fail-closed branches.

Results are `killed`, `survived`, `no-coverage`, `compile-error`, `test-error`,
`timeout` or reviewed `equivalent`. Only a test assertion observing the intended
semantic change kills a mutant. Compile errors/timeouts are defects in the
campaign, not kills. Equivalent status requires rationale and second review by
the project owner.

Thresholds are 100% killed for registered critical non-equivalent mutants and
95% for all other in-scope non-equivalent mutants, with zero unreviewed
survivors in security/regulatory code. Reports bind source span, operator,
original/mutated digest and killing test. Meta-fixtures ensure exclusions,
empty discovery and mutation-engine failure block.
