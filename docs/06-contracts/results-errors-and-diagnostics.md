---
id: CONTRACT-DOC-0009
title: Results errors and diagnostics
status: draft
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
historical-inputs: [REV-026, REV-035, REV-040, REV-049, REV-054]
---

# Results errors and diagnostics

`OperationResult<T>` discriminates `succeeded`, `invalid`, `conflict`,
`cancelled`, `unavailable`, `rejected`, `indeterminate` and `defect`. Success
contains the committed/verified value and evidence references; partial line
outcomes are domain results, not a successful global boolean.

Diagnostics have stable `DIAG-*` code, category, severity, stage, safe path,
retry/reconciliation meaning, causal diagnostic IDs and documentation URI.
Human messages are non-normative/localizable. Raw errors, XML, taxpayer data,
certificate material and secrets are excluded by construction.

Expected environmental/domain outcomes do not throw. Programmer invariant
violations may throw internally, are converted at public/CLI boundaries to a
redacted `defect`, and cannot be caught into success. Writer/observer failure is
reported without rewriting a durable result. Serializers preserve every
discriminant and unknown future variants fail safely in strict consumers.
