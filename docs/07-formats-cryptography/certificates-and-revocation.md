---
id: CRYPTO-DOC-0011
title: Certificates authorization and revocation
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-24
sources: [SRC-0024, SRC-0046, SRC-0050]
historical-inputs: [REV-014, REV-044]
decisions: [ADR-0020, ADR-0021, ADR-0055, ADR-0057]
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

## Revocation ownership and offline verification

The future commercial Facturacion host owns OCSP/CRL discovery, network
retrieval, refresh and cache. The VeriFactu library and local DSS provider do
not access AIA/CDP URLs, DNS, HTTP or implicit trust stores. The host supplies
bounded original evidence bytes plus provenance; provenance and a caller's
boolean are not a status result. The verifier independently validates the
evidence signature/authority, certificate and issuer binding, validation
instant, `thisUpdate`/`nextUpdate` and explicit maximum-age policy.

The result vocabulary is explicit: `valid` only when policy-required evidence
is authenticated and fresh; `revoked` rejects the certificate for the stated
instant; `unknown` and `stale` remain indeterminate and fail closed; absent,
malformed, unsupported or unavailable evidence never becomes `valid`. CRL,
OCSP, trusted-list and fallback precedence must be pinned per provider policy;
the provider may not silently fetch or fall back to a different source.

Tests cover expiry/not-yet-valid, revoked/unknown, wrong EKU/name/issuer/context,
stale data, weak key, chain ambiguity, responder authorization, malformed or
bad-signature responses, maximum-age boundaries, provider substitution and
network-denied operation. See [ADR-0055](../00-governance/decisions/ADR-0055-offline-revocation-evidence-boundary.md).
