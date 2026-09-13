---
id: PROD-DOC-0007
title: Product boundaries and exclusions
status: draft
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0002, ADR-0007, ADR-0008, ADR-0011]
requirements: [PROD-0020, PROD-0021, PROD-0022]
historical-inputs: [REV-001, REV-017, REV-028, REV-064, REV-072]
---

# Product boundaries and exclusions

## Ecosystem ownership

| Boundary | VeriFactu owns | Counterparty owns | Enforced interaction |
| --- | --- | --- | --- |
| Facturacion/host | Fiscal applicability result, record intent/commit, official output, status and diagnostics. | Commercial invoice transaction, users, authorization, presentation, payment and business storage. | Versioned public API plus atomic host adapter conformance. |
| Verification Engine | Fiscal profile mapping and interpretation of engine results. | Generic deterministic normalization, framed hashing, evidence and chain verification. | Exact published package/API/profile; no private imports or shared storage. |
| Durable store | Domain transaction protocol, identities and required invariants. | Atomicity, CAS, isolation, durability, enumeration and recovery semantics. | Capability negotiation and adversarial adapter suite. |
| Signature/certificate provider | Material-to-sign, authorization requirements and validation policy. | Protected key operation, certificate chain/material and provider evidence. | Minimal port; caller cannot assert `valid` without verification. |
| AEAT | Official request construction, correlation, interpretation and durable exchange state. | Service behavior and competent authority result. | Fixed environment/endpoint allowlist, mTLS and bounded transport. |
| Operator | Safe configuration schema, validation, diagnostics and runbooks. | Infrastructure, secrets, backups, monitoring response and authorized actions. | Startup/preflight gates and executable operational acceptance. |

## Excluded product capabilities

The repository does not own commercial invoice authoring, accounting ledgers,
tax calculation outside data required by RRSIF, payment collection, customer
identity/authentication, user-interface accessibility, PDF layout beyond
required QR/wording output contracts, cloud hosting, certificate issuance,
qualified trust services, legal advice, SII, TicketBAI/Batuz or B2B exchange.

## Exclusion safety rule

An exclusion is safe only when the boundary input/output, responsible party,
assumptions, conformance obligations and failure result are specified. The
component rejects missing capability, unsupported regime, incompatible version
or unverifiable provider result. It never implements a partial substitute under
the same public name.

## Deployment boundary

The package may run inside a desktop, server, worker or CLI process only when the
supported runtime and adapter contracts pass. Deployment does not expand legal
scope automatically. Multi-tenant use requires proven taxpayer isolation at
every cache, queue, store, certificate and diagnostic boundary.

## Future expansion

A hosted service, additional jurisdiction, new tax regime, browser runtime,
mobile key store or alternative integrity engine requires an explicit product
scope decision, threat/privacy model, compatibility plan and evidence. It cannot
be enabled as an undocumented configuration flag.
