---
id: PROD-INDEX
title: Product documentation
status: approved
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [GOV-001, GOV-002, GOV-003, GOV-005, GOV-006, PLAN-L1]
historical-inputs: [REV-001, REV-084]
---

# Product

This area is the authority for why VeriFactu exists, who relies on it, its
complete product responsibility and the exact limits of every guarantee. It
must remain understandable without reading implementation or marketing copy.

## Document set and order

1. `vision-and-success.md` — mission, outcome measures and complete-product definition.
2. `actors-and-stakeholders.md` — roles, interests, duties and authority.
3. `complete-scope.md` — full capability and lifecycle inventory.
4. `use-cases.md` — normal, failure, recovery, audit and evolution journeys.
5. `compliance-modes.md` — common and asymmetric mode behavior.
6. `capability-map.md` — canonical capability ownership and traceability.
7. `boundaries-and-exclusions.md` — ecosystem, deployment, jurisdiction and unsupported-scope behavior.
8. `claims-and-guarantees.md` — evidence required for every public assertion.
9. `support-and-lifecycle.md` — editions, compatibility, migration and EOL.

The required contents and exit conditions for each are fixed by
[`PLAN-L1`](../lot-1-foundations-plan.md#area-01-product).

## Mandatory viewpoints

Every document considers taxpayer, producer/commercializer, host integrator,
operator, representative, invoice recipient, auditor/inspector, AEAT, security
researcher and maintainer. A role may be performed by the same person, but its
responsibility is never silently transferred.

## Scope rule

The component covers both modes, complete regulatory editions, lifecycle and
failure behavior, public library/CLI/adapter contracts, integration with
Verification Engine, host conformance, security, privacy, bounded performance,
recovery, evidence and support. A demonstration, happy path or AEAT HTTP 200 is
not product completion.

## Area exit gate

- every capability and use case has a stable ID, owner and acceptance outcome;
- every exclusion identifies the responsible external component and safe behavior;
- claims distinguish specification, implementation, verification, external validation, publication and observation;
- historical findings have individual dispositions;
- product, regulatory and requirements views regenerate without contradiction.
