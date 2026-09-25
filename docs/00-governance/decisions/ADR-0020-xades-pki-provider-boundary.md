---
id: ADR-0020
title: XAdES and PKI provider boundary
status: accepted
authority: decision
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-24
sources: [SRC-0024, SRC-0043, SRC-0045, SRC-0046]
historical-inputs: [REV-012, REV-013, REV-014, REV-015, REV-016]
---

# ADR-0020: XAdES and PKI provider boundary

## Decision

Do not implement XAdES, canonicalization or PKI validation from scratch. Use
the locally controlled EU Digital Signature Services (DSS) library behind a
private provider boundary, pinned to an exact release and admitted only after
the exact AEAT profile, cryptographic behavior, PKI policy, security, licence,
toolchain and reproducibility gates pass. The DSS public demonstration service
and remote demo endpoints are never a runtime dependency. The exact version and
admission conditions are recorded in [ADR-0057](ADR-0057-local-eu-dss-provider.md).

Keys remain behind non-exportable handles where the platform permits. Signing
requests bind artifact digest, edition, profile, algorithm, signer expectation
and deadline. Before commit, VeriFactu verifies the exact returned document,
selected references, signature value, XAdES properties, certificate path,
validation instant, revocation policy and taxpayer/representative
authorization. Caller booleans and signer metadata are untrusted input.

## Consequences

Validation evidence, trust anchors, validation instant and revocation freshness
are explicit. The local provider performs no implicit network retrieval.
Provider unavailability, timeout, malformed output and authorization failure
are distinct typed results and negative tests. This decision does not enable
fiscal creation, establish AEAT acceptance or expose provider internals in a
public package.
