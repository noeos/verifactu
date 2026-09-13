---
id: DOM-DOC-0012
title: Domain invariants
status: draft
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-DOC-0002, REQ-DOC-0010]
historical-inputs: [REV-003, REV-007, REV-015, REV-019, REV-024, REV-084]
---

# Domain invariants

| ID | Invariant | Required proof |
|---|---|---|
| INV-0001 | Every fiscal artifact has one explicit context, mode tenure and regulatory edition. | property + mutation |
| INV-0002 | Invoice, record, artifact, submission, attempt, response and evidence identities cannot be substituted. | type + negative |
| INV-0003 | A committed billing record and its semantic content are immutable. | storage + recovery |
| INV-0004 | Correction/cancellation adds history and never erases the affected fact. | state-model + integration |
| INV-0005 | One chain scope has one linear durable head at each version. | concurrency + fault injection |
| INV-0006 | The predecessor digest and current record digest are distinct, correctly ordered values. | official vectors + mutation |
| INV-0007 | No record is submitted before record, artifact and chain transition are durable. | crash-point test |
| INV-0008 | A retry never regenerates or re-dates a committed fiscal record. | retry + byte-identity test |
| INV-0009 | Cross-context reads, writes, caches, locks and batches are impossible. | isolation/property test |
| INV-0010 | Unknown applicability, edition, mode or mandatory rule fails closed. | negative matrix |
| INV-0011 | Presence, decimal and time semantics survive every boundary without lossy coercion. | round-trip/property test |
| INV-0012 | Generated catalogues cover both directions with no silent unsupported value. | coverage report |
| INV-0013 | Invalid or indeterminate input cannot advance chain or submission state. | model/property test |
| INV-0014 | Mandatory event persistence follows its operation's declared atomicity. | fault injection |
| INV-0015 | Wire bytes and response bytes used as evidence are identified by digest and length. | tamper test |
| INV-0016 | Diagnostics and telemetry disclose no prohibited data class. | taint/redaction test |
| INV-0017 | Recovery selects only previously committed facts and never guesses. | model-based crash test |
| INV-0018 | Historical interpretation remains bound to its original edition package. | multi-edition replay |
| INV-0019 | Resource exhaustion cannot yield a partially accepted fiscal fact. | hostile workload test |
| INV-0020 | A claim of verification always identifies test, build, input and evidence digest. | provenance validation |

## Enforcement

Each invariant is encoded in the machine traceability registry before related
implementation merges. Critical invariants require at least two independent
proof styles where feasible—for example type construction plus runtime negative
test, or model test plus durable fault injection. Disabling a check must make a
mutation/negative fixture fail, preventing ceremonial controls.

An invariant breach is classified as corruption or security-relevant failure,
quarantines the affected scope, emits the mandated regulated event when safe,
and preserves evidence. Automatic repair is prohibited unless its algorithm is
edition-independent, lossless, idempotent and explicitly verified.
