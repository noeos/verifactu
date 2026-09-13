---
id: REPO-DOC-0005
title: Generated, vendored and temporary files
status: draft
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0009, ADR-0030, ADR-0034]
historical-inputs: [REV-065, REV-067, REV-069]
---

# Generated, vendored and temporary files

The artifact registry classifies source, generated, vendored immutable input and
temporary output. Generated entries declare producer, ordered inputs/digests,
toolchain, deterministic output set and clean-regeneration check. CI regenerates
in isolation and rejects stale, extra or hand-edited files.

Vendored official/tool data requires origin, exact version, download URI,
SHA-256/SHA-512, signature where available, licence/redistribution terms and
dependency closure. It is read-only to production and updated only through a
source/admission PR. Generated derivatives never erase parent custody.

Tasks create private randomized temporary roots under an approved OS temp base,
validate resolved containment before cleanup, use restrictive permissions and
clean on success/failure/signal. They never reuse home, repository root or broad
globs. Secrets and live responses cannot enter reusable caches/artifacts.

Ignore rules are allowlisted and tested: an ignored source/config/edition file
or unignored credential/build output fails policy. Archive bytes follow the
separate immutable historical manifest.
