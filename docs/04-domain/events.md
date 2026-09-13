---
id: DOM-DOC-0006
title: Regulated event model
status: draft
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-DOC-0002, REG-DOC-0005]
historical-inputs: [REV-017, REV-024, REV-027]
---

# Regulated event model

## Event record

An event contains event ID, context, exact edition catalogue code, occurrence
time, observation time, actor/system origin, affected identities, outcome,
reason/evidence references, prior related event when prescribed, and integrity
material required by the mode. Its payload is closed under the edition schema.

The edition catalogue must represent all applicable official event families,
including lifecycle/startup and shutdown, mode changes, installation/version or
configuration changes, restoration/recovery, anomaly and integrity detection,
export/conservation activity, certificate/credential lifecycle and other
edition-prescribed events. This semantic grouping does not replace exact
official codes; code generation from the pinned source does.

## Generation policy

- Events arise from committed facts, not best-effort log messages.
- Detection and recording are separate times; delay and clock quality remain
  visible.
- A failure while persisting a mandatory event places the affected operation in
  a fail-closed or quarantined state defined by its invariant.
- Repeated observations are deduplicated only where the official semantics and
  evidence remain equivalent; otherwise they are distinct events.
- Caller-supplied events cannot claim trusted system origin without an
  authenticated adapter and provenance.

## Relationship to observability

Operational logs may reference an event ID but cannot serve as the regulated
event store. Regulated events follow fiscal retention, integrity, export and
access controls. Telemetry follows minimization and shorter retention. Neither
contains raw secrets; sensitive event details are protected artifacts referenced
by digest and authorized locator.

## Verification

For each edition code, tests cover trigger, prohibited trigger, required fields,
time semantics, persistence failure, restart recovery, ordering, export and
redaction. A coverage report proves that every official event code is mapped or
explicitly declared non-applicable with a source-backed reason.
