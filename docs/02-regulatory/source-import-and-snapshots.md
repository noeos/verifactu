---
id: REG-DOC-0012
title: Source import and snapshots
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-15
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

Every file below `editions/source-snapshots/**/sources/` is marked `binary` in
`.gitattributes`. Git therefore neither diffs, merges nor normalizes the acquired
byte stream as text; the committed blob, source manifest and working file must
have the same SHA-256 and SHA-512 identities on every platform.

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

## Implementation status

The acquisition, quarantine, promotion and generation processes described above
are design requirements only.

The current repository contains no implemented source importer, promoter,
regulatory snapshot, generated contract package, negative policy runner or active
regulatory edition. No source bytes have been admitted as a reproducible runtime
input and no edition is approved for generation.

Implementation must first provide the bounded acquisition and offline promotion
pipeline, its manifests, dependency closure, negative fixtures, reproducibility
checks and review evidence. Until those outputs exist and are approved,
regulatory source import remains specified but unavailable.
