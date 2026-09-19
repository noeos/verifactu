---
id: SEC-DOC-0002
title: Assets, actors and trust boundaries
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0001, DOM-DOC-0002]
historical-inputs: [REV-010, REV-013, REV-015, REV-016]
---

# Assets, actors and trust boundaries

## Assets

Tier 0 assets are signing/private keys, trust policy, release identity and
administrative authorization. Tier 1 assets are fiscal facts, immutable records,
chain heads, wire artifacts, authority responses, regulated events and evidence.
Tier 2 assets are configuration, edition packages, idempotency state, queues and
security audit. Tier 3 assets are minimized operational telemetry and public
documentation. Classification, access, retention and recovery strengthen from
Tier 3 to Tier 0.

## Actors

Taxpayer/controller, authorized operator, application integrator, storage/key/
clock/network adapter, AEAT or other authority endpoint, maintainer/release
operator, auditor/support operator, dependency/build service, unauthenticated
attacker, malicious or compromised insider and accidental faulty component are
modeled separately. Service identity never inherits human authority implicitly.

## Trust boundaries

| Boundary | Untrusted input | Required mediation |
|---|---|---|
| caller → public API | objects, bytes, context, cancellation intent | strict decode, authorization, limits |
| adapter → core | persistence, clock, crypto, network results | typed port, validation, provenance |
| core → key service | digest/sign request | key policy, purpose, algorithm, audit |
| core → storage | record/artifact/journal | atomicity, encryption policy, integrity |
| process → authority | XML, TLS, response | fixed endpoint, TLS identity, schemas, limits |
| source → build | schemas/catalogues/dependencies | pin, digest, review, isolated generation |
| CI → release | attestations/artifacts | least privilege, protected environment |
| tenant/context A → B | identifiers and shared resources | mandatory scoped authorization/isolation |
| evidence → exporter | personal/fiscal/security data | policy projection, authorization, audit |

## Data-flow rule

Every implementation data-flow diagram must label asset class, trust change,
authenticator, validation, encryption expectation, size/time limit, persistence,
retention and failure state. New boundaries block implementation until their
threats, controls and negative tests exist.
