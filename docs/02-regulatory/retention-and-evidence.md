---
id: REG-DOC-0009
title: Regulatory retention and evidence
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
sources: [SRC-0010, SRC-0011, SRC-0014, SRC-0027, SRC-0028]
requirements: [REG-0040, REG-0041, REG-0042, PRIV-0010]
historical-inputs: [REV-025, REV-083]
---

# Regulatory retention and evidence

## Retained fiscal set

For each taxpayer/installation/edition and legally required period, the host
storage contract must preserve original validated semantics, official bytes,
hash/predecessor, signature and verification material where applicable, event
records/summaries, mode tenure, durable state transitions, submission attempts,
requests/responses, correlation, AEAT results, exports and repair/recovery
evidence. Product/source declarations and edition manifests are retained by the
producer for their applicable obligations.

## Retention schedule model

No universal hard-coded duration is assumed. A schedule record cites legal
basis, data/object category, taxpayer/producer role, triggering event,
start/end/suspension rules, litigation/audit hold, authority, review date and
post-expiry action. Tax limitation, invoicing, commercial/accounting, pending
proceedings and privacy duties are evaluated together by the deploying
controller and legal owner.

## Preservation properties

Retention requires integrity, accessibility, legibility and restoration—not
mere possession. Encrypted backups have recoverable key custody. Format/tool
migration preserves bytes, provenance and verification. Replicas and backups
are inventoried; silent copies are forbidden.

## Access and privacy

Access is purpose- and role-bound, attributable and scoped to a taxpayer.
Inspection paths expose required fiscal/event information while disassociating
unrelated confidential information. Data-subject requests are routed to the
controller; legal restriction/retention is recorded without pretending an
immutable fiscal record was erased.

## Export and deletion

Export includes manifest, counts, ordering, coverage range, digests, edition,
verification instructions and explicit gaps. Deletion after verified expiry is
authorized, staged, auditable and propagated to governed copies; legal holds
block it. Destruction never changes historical evidence claiming what existed.

## Proof

Scheduled restore drills start from isolated storage, reconstruct supported
verification/export capability and reconcile counts/digests/state. `REV-083`
closes only when interruption, lost-key, partial backup, corrupted object and
version-migration scenarios are executed successfully.
