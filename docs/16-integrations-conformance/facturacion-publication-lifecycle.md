---
id: INTEGRATION-DOC-0007
title: Facturacion publication lifecycle
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0022, ADR-0023, ADR-0038]
historical-inputs: [REV-022, REV-028, REV-031]
---

# Facturacion publication lifecycle

This lifecycle specifies and tests the future host boundary with a maintained
synthetic implementation. It is not evidence that the Facturacion application
already exists or is integrated.

Commercial draft is mutable and not fiscal issuance. Issue/correct/cancel commands
enter one host UoW; only committed VeriFactu success permits Facturacion to expose
the corresponding issued/corrected/cancelled state and QR/artifact. Rejection
leaves the draft/action uncommitted with actionable diagnostics.

Unavailable before commit is retryable under the same idempotency identity.
Unknown commit outcome is `indeterminate`: UI/business automation MUST freeze
duplicate publication, query/reconcile durable state and resume deterministically.
AEAT pending/rejected/accepted is separate from local fiscal issuance.

Events are published only from committed outbox state and consumers deduplicate.
Corrections/anulations create linked immutable operations rather than editing old
records. UX must present modality, submission/reconciliation and operator action
truthfully without claiming legal advice or remote acceptance not observed.
