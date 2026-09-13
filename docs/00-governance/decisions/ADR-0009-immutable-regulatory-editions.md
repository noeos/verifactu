---
id: ADR-0009
title: Immutable regulatory editions
status: proposed
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
supersedes: []
requirements: [REG-0010, REG-0011, REG-0012]
risks: [RISK-0003]
---

# ADR-0009: Immutable regulatory editions

## Context

Law, FAQ, XSD, WSDL, errors and examples change independently. A mutable
`latest` ruleset makes old records and declarations impossible to reproduce.

## Decision

Every behavior-affecting corpus is packaged as an immutable `RegulatoryEdition`
with a stable ID, applicability window, source manifest, byte digests, generated
contract digests, interpretation decisions and compatibility metadata. Published
editions never mutate. A new input produces a candidate successor even when the
publisher retains the same filename or apparent version.

Selection is explicit or derived by a documented date/applicability rule and is
recorded with every durable result. `latest` may be a discovery alias but never a
persisted or signed identity.

## Consequences and verification

Multiple editions coexist and historical verification remains available. Drift
monitoring cannot auto-promote a candidate. Reproducible imports, clean
regeneration, golden vectors and cross-edition tests prove isolation.
