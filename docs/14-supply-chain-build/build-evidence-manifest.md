---
id: BUILD-DOC-0018
title: Build evidence manifest
status: approved
authority: normative
owner: build-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0035, ADR-0036, ADR-0037]
historical-inputs: [REV-065, REV-067, REV-068, REV-079]
---

# Build evidence manifest

One versioned manifest binds repository/commit/tree, dirty-state proof, task graph,
toolchain/lock/config, official/generated inputs, environment, selected/executed
tasks/tests, output tree, three tarballs, consumer results, allowlists, licences,
CycloneDX/SPDX/reconciliation, reproducibility pair and provenance/attestations.

Every referenced object has media type, size, digest, producer, storage locator
and retention/sensitivity. The manifest recomputes closure and cannot embed only
URLs or producer assertions. Missing, duplicate, expired, wrong-SHA/digest or
failed/inconclusive component makes the candidate ineligible.

Canonical JSON serialization is deterministic; signing/attesting it does not
replace verification of its subjects. A clean verifier starts from manifest and
artifacts and independently validates graph completeness. Lot 4 incorporates the
verified manifest into the release dossier.
