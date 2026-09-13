---
id: AEAT-DOC-0013
title: Indeterminate delivery and reconciliation
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0023]
historical-inputs: [REV-024, REV-032, REV-042]
---

# Indeterminate delivery and reconciliation

Indeterminate delivery means request application cannot be proved or disproved:
write/response loss, cancellation after possible send, malformed/unattributable
response or result-store failure. The attempt, exact request bytes, all network
facts and any response bytes are committed before further action; the item moves
to `reconciliation-required` and is excluded from ordinary retry discovery.

Reconciliation builds edition-defined consultation criteria from the original
record identities and context, executes a separately journaled attempt, parses/
correlates results and appends one of: confirmed accepted/status, confirmed
absent with authorized resend, still unknown, conflicting remote evidence or
operator escalation. It never edits the original observation.

Timeout/absence is not automatically proof of non-application. Safe resend
criteria are sourced and operation-specific. Repeated reconciliation is
idempotent and bounded. Tests simulate response loss before/after AEAT processing,
stale consultation, duplicate remote entries, partial batch and crash at each
reconciliation transition.
