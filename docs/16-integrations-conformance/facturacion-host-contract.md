---
id: INTEGRATION-DOC-0006
title: Facturacion host contract
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0002, ADR-0017, ADR-0022, ADR-0038]
historical-inputs: [REV-028, REV-029, REV-030, REV-084]
---

# Facturacion host contract

This is the versioned contract for a future consumer. The Facturacion product is
not yet implemented; current conformance uses the maintained synthetic host and
does not claim real-product integration or make it a VeriFactu `1.0.0` gate.

Facturacion supplies authenticated authorization context, explicit issuer/system/
installation identities, taxpayer/mode tenure, regulatory edition, validated
commercial invoice command and one joint unit of work. VeriFactu returns typed
commit/result, fiscal record/artifact/evidence references, QR/publication data,
diagnostics and follow-up state.

Facturacion MUST NOT precompute hashes/XML/QR, select hidden defaults, duplicate
fiscal rules or publish an invoice as issued before successful atomic commit.
VeriFactu never owns user/customer UI, pricing or commercial invoice storage.

Contract schemas reject ambiguous decimal/date/timezone/identity, tenant mismatch,
missing edition/mode/authorization and stale command. Idempotency keys have owner,
scope and retention. Logs/results minimize personal data and expose safe diagnostic
IDs. A maintained synthetic host proves every command/result/event/version.
