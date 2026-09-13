---
id: ADR-0021
title: Separation of official and internal integrity claims
status: proposed
authority: decision
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0011, ADR-0020]
sources: [SRC-0023, SRC-0024, SRC-0029, SRC-0043]
historical-inputs: [REV-015, REV-021]
---

# ADR-0021: Separation of official and internal integrity claims

## Decision

Model official RRSIF fingerprint/chaining, XML reference integrity, XAdES
profile validity, certificate trust, acting-party authorization, generic Noeos
evidence and AEAT processing as separately identified claims. Each records its
subject bytes/data, edition/profile, verifier, instant, result and evidence.

Verification Engine receives only the namespaced domain-neutral projection
defined by the VeriFactu evidence profile through its public package API. It
does not calculate or validate tax-specific official formats. A combined report
may aggregate claims but cannot erase an indeterminate or failed component.

## Consequences

There is no public `verified: boolean`. Tests mutate each layer independently
and prove that success in one does not promote another.
