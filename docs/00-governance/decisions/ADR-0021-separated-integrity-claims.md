---
id: ADR-0021
title: Separation of official and internal integrity claims
status: accepted
authority: decision
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-24
dependencies: [ADR-0011, ADR-0020]
sources: [SRC-0023, SRC-0024, SRC-0029, SRC-0043]
historical-inputs: [REV-015, REV-021]
---

# ADR-0021: Separation of official and internal integrity claims

## Decision

Model official record/format/fingerprint/chaining, XML/XSD structure, XMLDSig
cryptographic validity, XAdES profile validity, certificate path/time/revocation,
acting-party authorization, AEAT processing and generic Noeos Verification
Engine evidence as separately identified claims. Each records its subject
bytes/data, edition/profile, verifier, validation instant, typed result and
evidence provenance. Successful format parsing, cryptographic verification,
Noeos Engine evidence or a QR decode cannot imply another claim.

Verification Engine receives only the namespaced domain-neutral projection
defined by the VeriFactu evidence profile through its public package API. It
does not calculate or validate tax-specific official formats. A combined report
may aggregate claims but cannot erase an indeterminate or failed component.
`valid`, `invalid/revoked`, `unknown`, `stale`, `unavailable` and `aborted` remain
distinguishable. No summary boolean, `verified` label or success in one layer
upgrades another layer or converts uncertainty to valid.

## Consequences

There is no public `verified: boolean`. Tests mutate and fault each layer
independently, exercise every aggregation precedence, and prove that success in
one does not promote another. This elaborates ADR-0021 for P4; it does not claim
implementation or regulatory approval.
