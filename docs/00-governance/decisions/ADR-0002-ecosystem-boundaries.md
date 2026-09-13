---
id: ADR-0002
title: Ecosystem repository boundaries
status: proposed
authority: decision
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-13
supersedes: []
---

# ADR-0002: Ecosystem repository boundaries

## Context

Facturacion, VeriFactu and Verification Engine form a dependency chain but have
different reasons to change. Shared internals or duplicated rules would couple
regulatory, generic integrity and commercial concerns.

## Options considered

1. One shared implementation/database: simple local calls, but collapsed trust
   boundaries, coupled releases and unclear ownership.
2. Duplicate logic in consumers: local autonomy, but divergent fiscal truth.
3. Separate repositories with versioned public contracts and conformance tests:
   explicit integration cost, but independent ownership and evolvability.

## Decision

Adopt option 3. Verification Engine owns generic evidence/integrity; VeriFactu
owns all RRSIF and AEAT semantics; the future Facturacion product will own
commercial invoicing and customer experience. Dependencies flow only through
supported public contracts.

Facturacion is not yet implemented. Its ownership is prospective target
architecture; VeriFactu proves the boundary now with a synthetic host, and real
integration is future work in the Facturacion repository rather than a VeriFactu
`1.0.0` gate.

## Consequences

Adapters, version negotiation and cross-repository compatibility matrices are
mandatory. No shared database, private import or backdoor may bypass a contract.
Coordinated changes require published compatibility evidence.

## Verification and reversal

Architecture dependency rules and consumer/provider conformance suites enforce
the boundary. A boundary change requires successor ADRs in every affected
repository and a versioned migration.
