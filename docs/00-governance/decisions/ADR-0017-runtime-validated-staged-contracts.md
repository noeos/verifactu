---
id: ADR-0017
title: Runtime-validated staged public contracts
status: accepted
authority: decision
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0041, SRC-0042, SRC-0050]
historical-inputs: [REV-015, REV-018, REV-026, REV-027, REV-047, REV-055]
---

# ADR-0017: Runtime-validated staged public contracts

## Decision

All untrusted public values enter through strict versioned codecs and become
immutable domain values only after runtime validation. TypeScript types are
developer assistance, not authority. Commands expose explicit
prepare/confirm/commit/send/observe/verify stages so a prepared artifact cannot
silently outlive its sequence head, edition or host transaction.

Results are serializable discriminated unions covering success, invalid input,
conflict, cancellation, unavailable capability, provider failure,
indeterminate external effect and internal defect. Ports receive explicit
clock, randomness, storage, key, XML and network capabilities with limits,
cancellation and ownership. No broad callback or ambient singleton is trusted.

## Consequences and verification

Every DTO needs JSON/NDJSON round trips, unknown-field and unsafe-number
negatives, Unicode tests and compatibility fixtures. Each operation proves its
pre/postconditions, stale-token behavior, resource cleanup and truthful CLI
mapping.
