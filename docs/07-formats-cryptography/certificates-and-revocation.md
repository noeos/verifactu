---
id: CRYPTO-DOC-0011
title: Certificates authorization and revocation
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0024, SRC-0046, SRC-0050]
historical-inputs: [REV-014, REV-044]
---

# Certificates authorization and revocation

Certificate validation separates parse, cryptographic chain, trust anchor,
validity interval at the declared instant, key usage/EKU, algorithm/key strength,
revocation status/freshness and acting-party authorization for taxpayer/system/
operation. A valid date range or TLS handshake alone proves none of the other
claims.

Credentials are referenced by opaque provider-scoped handles. Discovery and
selection expose safe certificate identity/fingerprint and capability, never
private key bytes. Selection is explicit and bound to context; no “first
certificate” rule. Rotation creates a new binding and preserves historical
validation evidence.

Online OCSP/CRL/trusted-list retrieval, if required by policy, is a separate
bounded/cacheable effect with authenticated source, freshness and failure state.
Offline validation records unavailable/indeterminate rather than inventing
good status. Tests cover expiry/not-yet-valid, revoked/unknown, wrong EKU/name/
issuer/context, stale data, weak key, chain ambiguity and provider substitution.
