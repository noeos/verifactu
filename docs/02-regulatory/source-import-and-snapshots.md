---
id: REG-DOC-0012
title: Source import and snapshots
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-15
review-by: 2026-10-12
decisions: [ADR-0006, ADR-0009, ADR-0012, ADR-0054]
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

## P3 implementation state

`internal/source-import/acquire.mjs` is the only networked preparation step. It
accepts the schema-validated closed plan, exact HTTPS origins, manual redirects,
identity-only content encoding, 30-second request deadlines and per-source
streamed byte caps. It writes temporary files with incremental SHA-256/SHA-512,
checks media magic and exact length, synchronizes them and atomically publishes
only a complete quarantine. Custody records requested/final URL, selected
headers, runtime, DNS/proxy/TLS/encoding policy and the acquisition-artifact
digest. `promote.mjs` runs offline, authenticates that digest, accepts only
regular non-symlink files, rechecks both content digests, records its own tool
identity and atomically publishes a complete new snapshot. Both stages use
exclusive locks and refuse existing destinations. Production packages import
neither component.

`policy:regulatory-source-negative` replays a complete 37-source acquisition from
the immutable snapshot without network and falsifies HTTP status, redirect,
declared/streamed size, media magic, digest drift, case-insensitive path collision,
dependency cycle, open licence, forbidden content encoding, partial-acquisition
rollback, immutable quarantine/snapshot destinations, post-acquisition mutation
and missing file. Archive depth/decompression controls remain fail-closed by
absence: the current plan admits no archive kind; admitting one first requires a
bounded archive implementation and its zip-bomb/link/device/path test suite.

The snapshot is blocked because seven mandatory observations are unavailable.
Structural XSD/WSDL extraction is permitted under ADR-0054 only to produce an
equally blocked candidate; `creationAllowed` remains false throughout.
