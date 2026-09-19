---
id: DOM-DOC-0003
title: Identities and execution context
status: approved
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0011, DOM-DOC-0002]
historical-inputs: [REV-003, REV-015, REV-016, REV-019]
---

# Identities and execution context

## Identity tuple

| Identity | Required components | Equality |
|---|---|---|
| Context | tenant + taxpayer + system/installation + edition | exact typed equality |
| Fiscal document | issuer + series/number + issue date | edition-defined canonical equality |
| Billing record | context + record kind + stable generated ID | never content-only |
| Event | context + event ID | stable and non-recycled |
| Chain | context + official chain discriminator | exact scope equality |
| Submission | envelope ID + context | stable across attempts |
| Attempt | submission ID + monotonic attempt ID | unique append |
| Artifact | media type + byte digest + byte length | byte identity |

IDs use opaque, collision-resistant values from an injectable generator. They
do not encode personal data, sequence claims or timestamps. A duplicate ID with
different content is corruption; the same idempotency key with different input
is a conflict, not a cache hit.

## Mandatory context

Every public operation receives an immutable `OperationContext` containing
tenant, taxpayer, installation/system identity, active regulatory edition,
dated mode tenure, locale only for presentation, clock reference, correlation
ID and authorization principal. Ambient globals, process environment and
request-local mutable singletons cannot supply fiscal context.

## Context isolation

All indexes, chain locks, caches, idempotency stores, artifact paths and metrics
labels include a non-sensitive context discriminator. Cross-context lookup must
fail even when record IDs collide. Batch construction rejects mixed taxpayer,
installation, edition or mode unless an explicit official contract permits it.

## Serialization and comparison

Canonicalization is per value object and edition. Unicode normalization,
whitespace, case, decimal scale, timezone and leading zeros are never changed by
generic utilities. Both source form and accepted semantic form are retained when
needed for evidence. Comparisons return equal, unequal or indeterminate with a
diagnostic; indeterminate never defaults to equal.

## Idempotency

An idempotency record binds context, operation, caller key, canonical input
digest, result identity and expiry/retention policy. Repetition with identical
input returns the committed result; mismatched input fails; an interrupted
operation is recovered from its journal state. Idempotency cannot bypass chain
serialization or regulatory validation.
