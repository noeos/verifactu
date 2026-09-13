---
id: DOM-DOC-0002
title: Fiscal domain model
status: approved
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0011, DOM-DOC-0001, REQ-DOC-0003]
historical-inputs: [REV-003, REV-015, REV-017, REV-020, REV-024]
---

# Fiscal domain model

## Bounded contexts

| Context | Owns | Does not own |
|---|---|---|
| Fiscal intake | typed invoice facts and provenance | XML, network, persistence |
| Applicability | territory, taxpayer/system applicability, edition | user preference |
| Record construction | alta/anulación/event semantics | transport retries |
| Integrity | chain input, fingerprint, signature intent | key custody implementation |
| Serialization | schema-specific deterministic bytes | fiscal policy |
| Journal | atomic durable append and recovery | external API acceptance |
| Submission | batches, attempts, acknowledgements | record regeneration |
| Evidence | provenance graph and export | observability exhaust |
| Diagnostics | stable findings and remediation | silent coercion |

## Aggregates

- `FiscalContext` is the root for applicability, edition, mode, taxpayer and
  installation. No dependent aggregate can exist without its identifier.
- `InvoiceFact` is immutable source input with explicit provenance and presence.
- `BillingRecord` is an immutable `AltaRecord` or `AnulacionRecord`; it owns its
  identity, context, generation time, edition, ordered chain input and digest.
- `EventRecord` is an immutable regulated event, scoped to the same context but
  never inserted into a billing-record chain unless an official edition says so.
- `ChainHead` is a versioned pointer to the last durably committed record for one
  chain scope; compare-and-append is atomic.
- `SubmissionEnvelope` references committed record identities and immutable wire
  artifacts. It never owns or edits them.
- `SubmissionAttempt` records one endpoint, request digest, time, outcome and
  response artifact; retry creates another attempt under the same envelope.
- `EvidenceBundle` is a derived, signed/attested view over immutable references.

The complete named model is not allowed to disappear inside generic DTOs:

| Model element | Boundary decision |
|---|---|
| `RegulatoryEdition` | immutable referenced policy package, never mutable runtime configuration |
| `ProducerRelease` | exact distributable product identity plus declaration/evidence references |
| `TaxpayerContext` | applicability and fiscal identity boundary |
| `Installation` | system installation identity within one taxpayer context |
| `ComplianceModeTenure` | dated immutable mode interval and transition evidence |
| `BillingSequence` | chain scope, head version and atomic append policy |
| `BillingRecord` | immutable alta/anulación aggregate |
| `EventSequence` | edition-scoped event chronology independent from billing chains |
| `EventRecord` | immutable regulated event aggregate |
| `Submission` | ordered selection of committed records for an official service |
| `Exchange` | one immutable transport attempt and response/outcome evidence |
| `ComplianceEvidence` | immutable attributable graph over the preceding identities |

These separations specialize the artifact boundaries approved in `ADR-0011`.
References connect aggregates; ownership or structural nesting never merges
their identities or lifecycles.

## Value objects

Tax identifier, series/number, monetary amount, tax rate/key, date/time,
software/system identifier, installation identifier, fingerprint, certificate
reference, endpoint identity, schema edition and diagnostic code are validated
value objects. Construction is total: it returns a valid value or structured
diagnostics, never a partially normalized value.

## Dependency direction

Domain semantics depend only on edition interfaces and pure primitives.
Serialization, persistence, cryptography, clocks and network implement ports.
Adapters may translate external representations but cannot introduce new domain
states. Generated official catalogues are inputs pinned by digest.

## Consistency boundaries

Record construction plus durable chain append is one logical transaction.
Network submission is deliberately outside it. Evidence describing a record is
not publishable until the record and its chain-head transition are durable.
Recovery may resume submission but may never recompute a committed record with
new time, edition, catalogue or predecessor.
