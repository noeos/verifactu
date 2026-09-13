---
id: REQ-DOC-0003
title: Functional requirements
status: draft
authority: normative
owner: requirements-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0007, ADR-0009, ADR-0011, ADR-0014]
historical-inputs: [REV-001, REV-055]
---

# Functional requirements

## Context and preparation

| ID | Requirement |
| --- | --- |
| `FUN-0001` | Every operation MUST carry validated taxpayer, installation, edition, mode-tenure and command identities. |
| `FUN-0002` | Preparation MUST produce immutable semantic intent tied to the exact predecessor/head observation and input digest. |
| `FUN-0003` | Commit MUST recompute/verify all trusted derivations and reject caller-fabricated bytes, hash, signature metadata or evidence. |
| `FUN-0004` | Runtime input validation MUST reject unknown fields, unsafe numbers, invalid Unicode, malformed identifiers and values outside edition limits. |
| `FUN-0005` | Cancellation/deadline MUST propagate through every async/provider/adapter boundary with deterministic no-false-success outcome. |

## Records, rules and official representations

| ID | Requirement |
| --- | --- |
| `FUN-0010` | Alta MUST represent every official field and conditional group for the active edition. |
| `FUN-0011` | Anulación MUST identify the exact prior fiscal fact and represent every official field/condition. |
| `FUN-0012` | Complete edition rules MUST run before durable commit and identify every failing rule without unsafe partial acceptance. |
| `FUN-0013` | Totals and breakdown relationships MUST use exact decimal semantics and edition-defined rounding; binary floating point MUST NOT decide fiscal equality. |
| `FUN-0014` | XML serialization MUST be deterministic, namespace-correct, encoding-safe and XSD-valid against the pinned graph. |
| `FUN-0015` | XML parsing/validation MUST be bounded, offline, DTD/entity-disabled and reject ambiguous/invalid namespace or character content. |
| `FUN-0016` | Hash input MUST use the exact edition fields/order/encoding and predecessor semantics, producing official algorithm/encoding output. |
| `FUN-0017` | Applicable XAdES MUST cryptographically bind the intended record with exact profile/transforms and verified certificate evidence. |
| `FUN-0018` | QR/URL generation MUST validate all source facts and produce exact mode-specific encoded content and rendering parameters. |
| `FUN-0019` | Verification MUST recompute from retained source bytes/material and report structure, rule, hash, chain, signature and context defects independently. |

## Mode and events

| ID | Requirement |
| --- | --- |
| `FUN-0020` | Mode selection MUST resolve from immutable applicable tenure at generation time rather than current process configuration. |
| `FUN-0021` | Each mode MUST enable all and only its applicable signature, event, transmission and invoice-representation obligations. |
| `FUN-0022` | Transition/renunciation MUST record intent, authorization, attempts, effective evidence and final dates without implicit fallback. |
| `FUN-0023` | Every official non-verifiable event type MUST have complete trigger, content, chain, signature, state and retention behavior. |
| `FUN-0024` | Periodic event summaries MUST cover a contiguous explicit interval exactly once and remain linked to underlying events. |

## Durable state and consistency

| ID | Requirement |
| --- | --- |
| `FUN-0030` | Host invoice outcome, billing-record commit, sequence-head advance and outbox insertion MUST share one atomic protocol. |
| `FUN-0031` | Sequence genesis and CAS advance MUST reject missing, stale, cross-context, duplicate or impossible heads. |
| `FUN-0032` | Idempotency MUST bind operation identity to complete canonical input and return the original outcome only for an exact match. |
| `FUN-0033` | Every submission attempt MUST have immutable identity, claimed records, lease/fencing data, request digest and durable result state. |
| `FUN-0034` | Expired/abandoned submitting work MUST enter reconciliation before it becomes resendable when delivery is possible. |
| `FUN-0035` | Attempt count, lease time and processing time MUST advance from durable facts and resist clock rollback/restart. |
| `FUN-0036` | Failure to persist a result MUST NOT report the operation completed; recovery MUST discover the unresolved attempt. |
| `FUN-0037` | Observers/hooks MUST execute outside the authoritative transaction or be isolated so their failure cannot contradict durable success. |

## AEAT exchange

| ID | Requirement |
| --- | --- |
| `FUN-0040` | Endpoint/environment/service/certificate selection MUST come from an immutable edition allowlist and validated deployment context. |
| `FUN-0041` | A batch MUST contain 1–1000 eligible ordered records and the complete official header/envelope for its service. |
| `FUN-0042` | Transport MUST enforce mTLS/TLS policy, request/response limits, timeouts, redirect prohibition and content-type/magic validation. |
| `FUN-0043` | Response parsing MUST follow pinned official structure and correlate every item by complete fiscal identity. |
| `FUN-0044` | Batch and per-record results MUST preserve accepted, accepted-with-errors, rejected and indeterminate distinctions. |
| `FUN-0045` | A missing, duplicate, conflicting or uncorrelated response item MUST be indeterminate and MUST NOT imply acceptance. |
| `FUN-0046` | AEAT waiting instructions MUST persist and gate all workers across restart using safe clock semantics. |
| `FUN-0047` | Retry MUST distinguish pre-delivery safe failure from possible delivery and require consultation/reconciliation for the latter. |
| `FUN-0048` | Requests and responses MUST be retained byte-faithfully with digest, timing, endpoint, identity and redacted diagnostics. |

## Inspection, export and surfaces

| ID | Requirement |
| --- | --- |
| `FUN-0050` | Export MUST state taxpayer/context, edition, range, counts, order, completeness gaps and manifest digests. |
| `FUN-0051` | Import/restore verification MUST reject corruption, omission, reordering, cross-context substitution and unknown edition. |
| `FUN-0052` | Inspection MUST support complete authorized query/verification without exposing unrelated confidential data. |
| `FUN-0053` | Public DTOs/results MUST be serializable and round-trip through documented JSON schemas without unsafe numeric loss. |
| `FUN-0054` | CLI MUST process bounded NDJSON as a true stream, preserve order as specified, honor backpressure/cancellation and emit one structured result per input. |
| `FUN-0055` | CLI grammar, help, version, stdout/stderr and exit codes MUST match the published contract on every supported platform. |
| `FUN-0056` | Filesystem output MUST use race-safe no-overwrite/atomic replacement semantics as declared and surface all close/flush/rename errors. |
| `FUN-0057` | Adapter conformance MUST execute every mandatory invariant and fail when no implementation/capability is supplied. |
| `FUN-0058` | Verification Engine integration MUST use only a compatible published public API/profile and verify its returned evidence before fiscal commit. |

## Completeness

The generated edition catalogue expands official record fields, rule branches,
event types, AEAT errors and schema elements into subordinate requirements/tests.
A single row above cannot be used to hide incomplete generated coverage.
