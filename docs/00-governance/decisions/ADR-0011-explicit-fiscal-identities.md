---
id: ADR-0011
title: Explicit fiscal identities and artifact boundaries
status: accepted
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
supersedes: []
requirements: [FUN-0001, FUN-0002, FUN-0003]
risks: [RISK-0005]
---

# ADR-0011: Explicit fiscal identities and artifact boundaries

## Context

The previous broad record DTO confused invoice facts, official bytes, signature,
chain evidence and AEAT state, enabling mismatched or fabricated artifacts.

## Decision

Commercial invoice, billing-record intent, validated semantic record, official
wire bytes, hash/chain evidence, signature, durable commit, submission attempt,
transport exchange, AEAT record result and compliance evidence are distinct
identified objects. Taxpayer, installation, regulatory edition, mode tenure and
sequence identity accompany every dependent operation.

Conversions are one-way controlled transitions producing typed evidence. Raw
bytes or caller-asserted metadata cannot be committed as trusted output.

## Consequences and verification

The API is more explicit and cannot offer convenience shortcuts that erase
identity. Property tests, type-level boundaries, mutation tests and persistence
fault injection prove that cross-context or cross-material substitution fails.
