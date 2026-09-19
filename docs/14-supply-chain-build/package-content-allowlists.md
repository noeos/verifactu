---
id: BUILD-DOC-0010
title: Package content allowlists
status: approved
authority: normative
owner: build-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0035]
historical-inputs: [REV-065, REV-084]
---

# Package content allowlists

Each of library, CLI and adapter-kit has a closed manifest of required/optional
paths, file type, mode/executable bit, maximum size, media type and semantic
owner. Actual `npm pack` tarballs are safely extracted and every path/type/mode/
size/digest compared; both extra and missing entries fail.

Forbidden content includes source-only internals/tests/config, credentials,
environment files, logs, coverage/evidence raw data, private maps, sibling paths,
development scripts and undeclared editions. Required content includes declared
exports/types/maps policy, CLI executable, schemas/edition access, README,
LICENSE/NOTICE and package metadata.

Archive traversal, absolute paths, links/devices, case collisions and decompression
limits are tested before extraction. `npm pack --dry-run` output is informative,
not the oracle. Allowlist changes require public/security/licence impact review.
