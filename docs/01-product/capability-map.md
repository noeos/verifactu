---
id: PROD-DOC-0006
title: Capability map
status: draft
authority: generated
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0010]
historical-inputs: [REV-063, REV-074]
---

# Capability map

This document defines the generated view contract. The canonical capability
records live with requirements; the final file is regenerated and CI rejects
manual drift.

## Required relationship columns

| Field | Meaning |
| --- | --- |
| Capability | Stable `CAP-*` identity and title. |
| Modes/editions | Exact applicability, never implied “all”. |
| Owner | VeriFactu, host, Verification Engine, adapter/provider or AEAT. |
| Upstream | Product/legal source and accepted ADRs. |
| Requirements | Every applicable `PROD/REG/FUN/NFR/SEC/PRIV/PERF-*`. |
| Contracts | API/CLI/adapter/schema/state-machine surfaces. |
| Threats/risks | Applicable `THR-*` and `RISK-*`. |
| Tests | Positive, negative, boundary, adversarial and recovery obligations. |
| Evidence | Exact `EVD-*` definition and release disposition. |
| Lifecycle | Spec/implementation/verification status and review trigger. |

## Coverage rules

Every `CAP-0001`–`CAP-0016` must have at least one product requirement, normal
and failure use case, owner, verification obligation and evidence definition.
Regulatory, security and durability capabilities require independent oracles.
External ownership requires a boundary contract and conformance test, not a
blank implementation link.

## Forbidden map states

The generator rejects capability without owner, mandatory requirement without
capability, test without requirement, evidence without exact subject, unknown
identifier, `verified` without passing evidence, incompatible edition/mode links,
and manually inserted completion claims.

## Review views

The same canonical graph generates capability-centric, requirement-centric,
source-centric, threat-centric, finding-centric and release-centric views.
Counts are navigation aids and never substitute checking the linked behavior.
