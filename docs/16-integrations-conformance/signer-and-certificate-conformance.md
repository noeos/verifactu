---
id: INTEGRATION-DOC-0012
title: Signer and certificate conformance
status: approved
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0024, SRC-0043, SRC-0044, SRC-0045, SRC-0046]
decisions: [ADR-0020, ADR-0021, ADR-0038]
historical-inputs: [REV-010, REV-011, REV-012, REV-013, REV-014, REV-062]
---

# Signer and certificate conformance

Signer receives exact unsigned artifact, edition/profile, key handle and explicit
algorithm; private key never leaves provider. It returns exact signed bytes plus
certificate chain/identity, algorithms, references/transforms and provider proof.
The caller recomputes and independently verifies all references and policy.

Tests cover the pinned AEAT XAdES profile, canonicalization/namespaces, multiple/
wrapping references, altered signed/unsigned nodes, wrong certificate/identity/
purpose, validity/revocation policy and algorithm downgrade. Cryptographic
validity, certificate trust, authorization and regulatory profile are separate
results.

Software test keys are ephemeral and marked non-production. Real HSM/remote levels
exercise authentication, concurrency, timeout, cancellation, lost response,
rotation and audit without logging secrets. Unsupported revocation availability
produces `indeterminate` according to policy, never valid by default.
