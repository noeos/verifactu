---
id: ADR-0035
title: Clean reproducible builds and closed package allowlists
status: proposed
authority: decision
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0030, ADR-0034]
sources: [SRC-0061]
historical-inputs: [REV-065, REV-066, REV-067, REV-084]
---

# ADR-0035: Clean reproducible builds and closed package allowlists

## Decision

Authoritative builds start from a clean checkout and authenticated prepared
inputs, declare environment/locale/time/umask/path, then deny undeclared network
and global/workspace state. Generated sources precede one canonical compilation.
Two isolated absolute directories must yield identical normalized trees and
byte-identical tarballs where the admitted packer permits.

Each package has a closed allowlist for path, type, mode, size, executable bit,
required asset and forbidden pattern. Tests extract the actual tarball and
install it into temporary consumers with the workspace unavailable, exercising
ESM, CJS, types, CLI, schemas/editions and negative deep imports.

## Consequences and verification

Path/time/nondeterministic tooling must be normalized or replaced; platform-
specific artifacts require separately scoped subjects rather than averaged
claims. Dirty-file, home-directory, global module, network and extra-file
fixtures must fail. Reproducibility differences retain both trees and a bounded
diagnostic report; normalization never erases semantically distributed bytes.
