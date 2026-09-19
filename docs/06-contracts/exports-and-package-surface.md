---
id: CONTRACT-DOC-0012
title: Exports and package surface
status: approved
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0015]
sources: [SRC-0050]
historical-inputs: [REV-050, REV-072, REV-084]
---

# Exports and package surface

Each package declares name, version, licence, supported Node/npm matrix,
`type`, `exports`, `types`, files allowlist, executable bins and side-effect
policy. Only root and documented versioned subpaths are accessible. Internal
filesystem layout, generated sources and dependency instances are not API.

ESM/CJS interoperability follows the exact Verification Engine consumer matrix
and must avoid dual-package state divergence. A single logical client/config/
symbol identity cannot be duplicated across entry formats. Type declarations
resolve under supported TypeScript modes without requiring source paths.

Pack verification inspects tarball contents, provenance/licences, secret/test
exclusion and deterministic manifest; then clean offline consumers install the
tarball and run imports, CLI, edition/catalog/schema access and negative deep
imports on every supported runtime/module system. Repository tests are
insufficient evidence for a published surface.
