---
id: REG-DOC-0012
title: Source import and snapshots
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
decisions: [ADR-0006, ADR-0009, ADR-0012]
requirements: [REG-0070, REG-0071, REG-0072, SEC-0070]
historical-inputs: [REV-004, REV-005, REV-006, REV-008, REV-009, REV-012, REV-037, REV-049]
---

# Source import and snapshots

## Two-phase process

Acquisition is an isolated networked process producing untrusted candidate
bytes. Verification/import is offline, parses only after bounds/integrity checks,
closes dependency graphs and produces a reviewed immutable manifest. Production
generation never downloads schemas or regulatory rules.

## Acquisition controls

- HTTPS host and redirect allowlist; no caller-provided endpoint.
- DNS/proxy/TLS behavior recorded; certificate verification never disabled.
- connect/read/total timeout, redirect, byte, file-count, nesting and
  decompression-ratio limits before expensive processing.
- expected status/media/magic/encoding validation; HTML error pages rejected.
- streaming download to a quarantined temporary file with incremental hashes.
- final URI, headers, timestamps, length, SHA-256/SHA-512 and tool version logged.
- archive paths normalized; traversal, links, devices, duplicates and
  case/Unicode collisions rejected.

## Dependency closure

Every XSD `include/import`, WSDL import and referenced catalogue is resolved only
through the candidate's approved mapping. Remote resolution during compile or
validation is forbidden. Cycles, namespace/location mismatch, duplicate logical
identity and missing dependency block import.

## Snapshot manifest

The manifest records source ID, publisher, title/version/date, authority,
licence, acquisition URI/final URI, file path, media type, size, dual digest,
dependency edges and redistribution decision. Paths are deterministic and do
not include workstation locations.

## Generation

Pinned generators convert source bytes into types, validators, rule/catalogue
records and vectors. Generated output includes source/generator identity and is
reproduced twice in clean isolated environments. Manual edits fail regeneration.

## Drift and rollback

Refresh always creates a separate candidate snapshot. Semantic and byte diffs
are reviewed together. Failed candidates cannot replace the active edition;
rollback selects a previously approved immutable edition, never overwrites
history.

## Adversarial verification

Fixtures cover oversized/truncated/HTML responses, zip bombs, traversal,
duplicate files, poisoned import URLs, DTD/entities, invalid encodings,
namespace substitution, changed bytes under same version and generator that
silently skips a source. Each must fail with a specific diagnostic.
