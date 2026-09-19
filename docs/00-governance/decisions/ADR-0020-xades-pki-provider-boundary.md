---
id: ADR-0020
title: XAdES and PKI provider boundary
status: accepted
authority: decision
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0024, SRC-0043, SRC-0045, SRC-0046]
historical-inputs: [REV-012, REV-013, REV-014, REV-015, REV-016]
---

# ADR-0020: XAdES and PKI provider boundary

## Decision

Do not implement XAdES, canonicalization or PKI validation from scratch. Admit
a locally controlled, pinned provider/reference implementation after exact
AEAT-profile, ETSI, security, licence and reproducibility evaluation; EU DSS is
the preferred candidate, never its public demo service.

Keys remain behind non-exportable handles where the platform permits. Signing
requests bind artifact digest, edition, profile, algorithm, signer expectation
and deadline. Before commit, VeriFactu verifies the exact returned document,
selected references, signature value, XAdES properties, certificate path,
validation instant, revocation policy and taxpayer/representative
authorization. Caller booleans and signer metadata are untrusted input.

## Consequences

Offline and online validation evidence, trust anchors and revocation freshness
are explicit. Provider unavailability, timeout, malformed output and
authorization failure are distinct durable diagnostics and negative tests.
