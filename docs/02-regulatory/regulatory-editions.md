---
id: REG-DOC-0005
title: Regulatory editions
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-16
review-by: 2026-10-12
decisions: [ADR-0009]
requirements: [REG-0010, REG-0011, REG-0012, REG-0016]
historical-inputs: [REV-004, REV-005, REV-006, REV-063, REV-084]
---

# Regulatory editions

## Edition identity

An edition is an immutable, content-addressed and human-labelled set containing:

- legal enactment/amendment applicability graph;
- AEAT source manifest and closed imported-file graph;
- generated types, schemas, catalogues, rules, diagnostics and vectors;
- interpretation ADRs and unresolved ambiguity disposition;
- supported modes, dates, environments and compatibility constraints;
- generator/toolchain identities and clean-regeneration digests;
- legal/technical review and approval evidence.

The edition ID is not derived only from an AEAT filename/version. A byte or
interpretation change creates a new candidate. The package label cannot conceal
content changes.

## Selection

Generation requires an explicit edition ID or a deterministic selection result
from operation date, applicability and an approved activation table. Selection
returns edition plus evidence, never a mutable global singleton. Persisted
records, events, attempts and exports carry edition identity.

## Lifecycle

`discovered -> imported -> generated-unverified -> candidate -> approved ->
active -> sunset -> historical`; `blocked` can occur before approval and
`revoked-for-generation` after a material defect. Published contents remain
immutable in every state.

Approval requires source provenance, dependency closure, schema/rule/vector
generation, independent comparison, negative fixtures, historical-finding
dispositions and owner/legal review. External AEAT validation is recorded by
environment and cases, never generalized.

The machine approval record is either `null` or a closed object containing a
decision ID, UTC decision time, accountable approver role and at least one
content-digested evidence locator. Only `active` may set `creationAllowed: true`;
every discovery, import, generation, candidate, blocked, approved-but-not-active,
sunset, historical or revoked-for-generation state forces it to `false`.

## Coexistence and migration

The runtime may verify all supported historical editions while allowing new
generation only under active applicable editions. Cross-edition conversion does
not rewrite original bytes/evidence. Migration changes configuration and future
selection, preserves old material and tests boundary-date transactions.

## Drift

Monitoring compares discovery metadata and bytes. Any drift opens a candidate
edition and impact graph. Critical drift affecting law, signature, hash, schema,
endpoint or accepted behavior blocks affected new release/generation claims
until reviewed. Unreachable sources also alert; cached bytes remain available.

## Reproducibility

A clean offline build from the manifest must reproduce generated artifacts. An
independent checker confirms source and output digests. Network access during
generation is forbidden.

## Baseline edition state

P3 has created immutable snapshot
`rrsif-2026-09-21-observed` and candidate
`rrsif-2026-09-21-observed-candidate`. The candidate is blocked and
verification-only: its approval is `null`, its `creationAllowed` flag is
`false`, and six required AEAT payload authorities remain explicitly mapped in
the lifecycle manifest. No active edition exists and no fiscal artifact
creation is available. The generated envelope is metadata-only until the
authoritative dependency graph is complete.
