---
id: PROD-DOC-0004
title: Complete use cases
status: draft
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
requirements: [PROD-0010, PROD-0011, PROD-0012]
historical-inputs: [REV-001, REV-084]
---

# Complete use cases

Each use case requires an applicability predicate, authorized actor, immutable
context, preconditions, success facts, rejected/indeterminate outcomes, crash
points, recovery, audit evidence and privacy behavior. Detailed scenarios are
derived into `TEST-*`; this catalogue fixes required coverage.

## Establishment and configuration

| ID | Use case | Required outcomes |
| --- | --- | --- |
| `UC-0001` | Install a published release | Verify package identity, provenance, support matrix, edition set and declaration before activation. |
| `UC-0002` | Register producer/taxpayer/installation context | Validate identity and isolation; reject collision, ambiguity or cross-context reuse. |
| `UC-0003` | Decide applicability | Return evidenced applicable/not-applicable/indeterminate result for the precise operation and date. |
| `UC-0004` | Configure providers/adapters | Prove capabilities and boundaries with conformance tests; secrets remain outside configuration artifacts. |
| `UC-0005` | Select initial mode | Require explicit authorized choice and create dated tenure; no default. |
| `UC-0006` | Activate an edition | Verify manifest, applicability and migration; never mutate an old edition. |

## Fiscal operation

| ID | Use case | Required outcomes |
| --- | --- | --- |
| `UC-0010` | Prepare and commit alta | Validate complete facts, derive official material, atomically bind invoice/record/sequence/outbox, return durable identity. |
| `UC-0011` | Prepare and commit anulación | Reference target truthfully, preserve original and create the next valid chained fact. |
| `UC-0012` | Correct/substitute rejected or erroneous data | Use allowed subsequent records and state transitions without overwrite. |
| `UC-0013` | Generate non-verifiable event | Detect required event, chain/sign/persist it and include it in summaries/exports. |
| `UC-0014` | Generate invoice QR/URL | Select mode-specific endpoint/content and render/encode exactly; invalid dates/amounts fail. |
| `UC-0015` | Verify record/chain/signature | Recompute from retained bytes and context using independent paths; report every defect without repair. |

## Submission and reconciliation

| ID | Use case | Required outcomes |
| --- | --- | --- |
| `UC-0020` | Submit VERI*FACTU records | Claim durable eligible work, build bounded ordered batch, authenticate, persist complete exchange and correlate every item. |
| `UC-0021` | Respond to AEAT requirement | Export/send the exact requested scope with reference and applicable signatures. |
| `UC-0022` | Handle partial acceptance | Persist per-record result and batch result; never infer omitted lines as accepted. |
| `UC-0023` | Recover lost/invalid response | Mark indeterminate, consult/reconcile before replay and preserve every attempt. |
| `UC-0024` | Respect AEAT waiting instruction | Persist server-provided wait, enforce it across restart/workers and avoid clock rollback bypass. |
| `UC-0025` | Rotate/expire certificate | Stop unauthorized operations safely, preserve queued work and resume only after validated replacement. |

## Inspection, operation and lifecycle

| ID | Use case | Required outcomes |
| --- | --- | --- |
| `UC-0030` | Export a taxpayer scope | Prove completeness, ordering, digest and access scope in a documented readable format. |
| `UC-0031` | Authorized inspection | Expose required fiscal/event data and verification while disassociating unrelated confidential data. |
| `UC-0032` | Backup and restore | Restore exact state, verify chain/outbox/attempt consistency and prevent duplicate blind send. |
| `UC-0033` | Crash at every durable boundary | Reach a defined recoverable state with no false success or lost record. |
| `UC-0034` | Change/renounce mode | Enforce tenure and effective date, finish applicable obligations and retain historical interpretation. |
| `UC-0035` | Upgrade edition/product/runtime | Preflight compatibility, migrate atomically, verify history and support rollback where semantically safe. |
| `UC-0036` | Investigate vulnerability/incident | Preserve privacy-safe evidence, bound affected releases/records, remediate and communicate. |
| `UC-0037` | End product support | Notify, export, verify, migrate and retain required declarations/evidence without abandoning fiscal data. |

## Mandatory negative journeys

Every use case covers malformed/oversized input, missing authority, duplicate
identity, cross-taxpayer context, stale edition, invalid transition, cancellation,
timeout, provider throw, process kill, disk full, corrupted storage, hostile XML,
unexpected content type, AEAT inconsistency and exhausted resources where
applicable. Absence of a safe path blocks approval.
