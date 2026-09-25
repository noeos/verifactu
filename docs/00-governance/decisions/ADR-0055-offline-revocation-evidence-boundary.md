---
id: ADR-0055
title: Offline certificate-revocation evidence boundary
status: accepted
authority: decision
owner: architecture-owner
created: 2026-09-24
last-reviewed: 2026-09-24
dependencies: [ADR-0002, ADR-0020, ADR-0021]
sources: [SRC-0089, SRC-0090]
historical-inputs: [REV-012, REV-014, REV-062]
---

# ADR-0055: Offline certificate-revocation evidence boundary

## Question and context

P4-D must validate certificate revocation without introducing ambient network
access into the VeriFactu library. CRL and OCSP evidence can be obtained online,
but retrieval, caching and operational refresh belong to the commercial billing
host, not this offline repository.

## Decision criteria

Preserve offline deterministic verification, cryptographic authenticity and
freshness checks, privacy, bounded resources, explicit uncertainty and a clean
ownership boundary between this package and a future commercial Facturacion
application. A caller-provided status boolean is not evidence.

## Options considered

- Fetch CRL/OCSP inside this library: rejected because it adds implicit network,
  endpoint, cache, clock and privacy behavior to an offline package.
- Return `valid` when evidence is absent and delegate all checks to the host:
  rejected because the host can accidentally or maliciously promote uncertainty.
- Have the host retrieve evidence and have this library validate exact supplied
  evidence offline: selected; each side owns a bounded, testable responsibility.

## Decision

The commercial Facturacion host owns CRL/OCSP discovery, HTTPS retrieval,
refresh scheduling, cache storage and delivery. This library owns offline
validation of caller-supplied bounded evidence bytes against the certificate,
issuer/trust configuration, validation instant and explicit maximum age. It
must validate the evidence signature/authority and applicable certificate
status and time fields; caller metadata alone is never trusted. The core and
provider have no AIA/CDP network lookup, DNS, HTTP client, implicit cache or
ambient trust-store access.

Typed revocation outcomes remain distinct: `valid` only with sufficient
authenticated, in-policy fresh evidence; `revoked` is a rejecting result;
`unknown` and `stale` are indeterminate and fail closed. Missing, malformed,
unsupported or unavailable evidence is never converted to `valid`. Evidence,
its digest/provenance, the validation instant, freshness policy and result are
bound to the verification claim. No actual commercial Facturacion integration
or host retrieval service is claimed by this repository.

## Consequences and residual risks

The host must operate secure retrieval and cache refresh; stale cache, responder
misconfiguration or retrieval outage may prevent a positive validation. The
host cannot override library verification with a boolean. Policy differences
between CRL and OCSP and any additional trusted-list requirement must be resolved
from the applicable immutable edition and documented provider profile.

## Verification

P4-D must exercise valid, revoked, unknown, stale, absent, malformed, wrong-
issuer, bad-signature, wrong-responder, not-yet-valid, expired and policy-age
cases; seeded mutations that promote unknown/stale to valid must fail. A
network-denied test proves no socket or resolver access in this package.

## Migration and reversal

The host/provider contract is versioned before P4-D implementation. Adding
implicit retrieval requires a successor ADR, a changed product boundary, a
separate threat/privacy assessment and new offline/network compatibility gates.
