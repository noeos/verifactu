---
id: REF-DOC-0009
title: Diagnostic and result vocabulary
status: draft
authority: informative
owner: documentation-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0017, ADR-0026]
---

# Diagnostic and result vocabulary

Results preserve success, accepted-with-errors, rejected/invalid, error,
indeterminate, unsupported, not-applicable-demonstrated, blocked, cancelled and
timeout. CI evidence adds passed/failed/error/skipped/absent; only explicit
validated success satisfies a claim.

Generated catalog maps stable diagnostic code to owning contract, severity,
parameters/redaction, retry/reconciliation and public compatibility. Unknown codes
remain unknown; exceptions/tool crashes cannot be caught into success.
