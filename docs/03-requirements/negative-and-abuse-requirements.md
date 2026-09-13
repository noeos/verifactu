---
id: REQ-DOC-0008
title: Negative and abuse requirements
status: draft
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0011, ADR-0012]
historical-inputs: [REV-001, REV-084]
---

# Negative and abuse requirements

## Input and representation

The system MUST reject missing/unknown/duplicate fields; wrong types; unsafe or
non-finite numbers; invalid decimal scale/range; malformed Unicode/surrogates;
forbidden XML characters; namespace substitution; duplicate IDs; unsupported
catalogue values; impossible dates; inconsistent totals; and conditionally
forbidden/present groups. Rejection precedes durable mutation and uses a stable
redacted diagnostic.

## Context and authority

The system MUST reject absent/ambiguous/stale edition, taxpayer, installation,
mode, sequence, command authorization or provider capability; cross-context
material; conflicting idempotency reuse; unauthorized mode change; and
certificate identity not authorized for the operation.

## XML, signature and source attacks

Tests MUST cover DTD/XXE/XInclude, entity expansion, deep/wide/oversized trees,
schema poisoning/network imports, zip bombs/traversal, encoding confusion,
signature wrapping, transform/algorithm substitution, duplicate signed IDs,
partial/multiple signatures, altered bytes and untrusted certificate claims.

## State, concurrency and persistence

Tests MUST cover stale/forged head, invalid genesis, parallel commit, duplicate
identity, partial transaction, disk full, lost acknowledgement, kill at every
write, expired worker committing, clock rollback, result-write failure,
corrupt/truncated restore and observer failure. No case reports success unless
authoritative durable state matches it.

## Network and AEAT

Tests MUST cover hostile endpoint/proxy, redirect, DNS/TLS/certificate failure,
timeout before/during/after possible delivery, truncated/oversized/wrong-media
response, malformed SOAP, wrong namespace, missing/duplicate/conflicting items,
unknown error, partial acceptance, replay and persisted wait across restart.

## Resource, privacy and supply-chain abuse

Tests MUST cover unbounded streams, slow peers, cancelled providers, queue
saturation, taxpayer starvation, log amplification/injection, diagnostic data
exfiltration, support-bundle misuse, secrets in errors, malicious adapters,
dependency compromise and untrusted-PR workflow privilege.

## Evidence quality

Every critical rejection has a mutation or deliberately broken fixture proving
the gate detects its failure class, unchanged authoritative state and resource
cleanup. A generic non-zero exit is insufficient.
