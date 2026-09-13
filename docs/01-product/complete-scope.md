---
id: PROD-DOC-0003
title: Complete product scope
status: approved
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0001, ADR-0007, ADR-0008, ADR-0009, ADR-0014]
historical-inputs: [REV-001, REV-084]
---

# Complete product scope

## Mandatory capability groups

| ID | Capability | Complete scope |
| --- | --- | --- |
| `CAP-0001` | Applicability | Evaluate and evidence subject, territory, regime, SII, activity, operation, role, authorization and effective date. |
| `CAP-0002` | Regulatory editions | Acquire, validate, pin, package, select, coexist, migrate and historically verify official sources/contracts. |
| `CAP-0003` | Fiscal model | Represent every supported alta, anulación, conditional block, catalogue value, total and cross-field rule. |
| `CAP-0004` | Modes | Complete common behavior plus VERI*FACTU transmission and non-verifiable signature/event obligations; dated adoption and renunciation. |
| `CAP-0005` | Generation | Simultaneous/immediately-prior record creation bound atomically to host invoice outcome. |
| `CAP-0006` | Integrity | Correct hash input, predecessor, genesis, chronology, immutable bytes and Verification Engine evidence profile. |
| `CAP-0007` | Signatures/certificates | XAdES generation and cryptographic verification where applicable; provider authorization, lifecycle and failure. |
| `CAP-0008` | Official formats | Complete deterministic XML/XSD/WSDL/SOAP, QR/URL, errors, encodings and bounded parsing. |
| `CAP-0009` | Durable consistency | Per-context sequence, CAS, transaction boundary, outbox, leases, attempts, idempotency, crash recovery and reconciliation. |
| `CAP-0010` | AEAT exchange | Environments/endpoints, mTLS, batching, response correlation, partial results, waiting instructions, retry and consultation. |
| `CAP-0011` | Inspection/export | Complete, authentic, scoped, legible export; chain/signature verification; authorized inspection without unrelated data. |
| `CAP-0012` | Public integration | Stable ESM/CJS/TypeScript library, CLI/NDJSON and adapter conformance with cancellation and deterministic diagnostics. |
| `CAP-0013` | Security/privacy | Threat controls, isolation, secret handling, minimal data, safe logs, hostile input and vulnerability response. |
| `CAP-0014` | Performance/reliability | Bounded memory/resources, streaming/backpressure, capacity, benchmark evidence, restart/recovery and overload behavior. |
| `CAP-0015` | Supply chain/release | Reproducible packages, SBOM/licences, provenance, signed releases, published verification and responsible declaration. |
| `CAP-0016` | Operations/support | Configuration validation, health without false readiness, monitoring, backup/restore contracts, incidents, migration and EOL. |

## Supported surfaces

The product includes a library as the canonical semantic surface, a CLI with
equivalent observable behavior for automation and inspection, adapter ports with
an executable conformance kit, schemas/vectors, and release evidence. Examples
are supported only when tested against packed artifacts.

## Complete means every dimension

Each capability is specified across both modes, every supported edition,
platform/runtime matrix, normal and adversarial input, first/subsequent record,
concurrency, cancellation, crash boundary, external outage, migration,
inspection, privacy and end-of-support. A capability absent from one applicable
dimension is not complete.

## Explicit exclusions

Commercial invoice editing, accounting, payments, catalogue, customer UI,
authentication and tenant administration belong to the host. TicketBAI/Batuz,
foral tax compliance, SII and B2B structured e-invoicing are separate regimes.
The component does not issue legal opinions, supply certificates, operate AEAT,
or guarantee third-party availability.

Exclusion never means silent acceptance: the boundary returns an explicit
unsupported/indeterminate result and preserves the facts required for audit.
