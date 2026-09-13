---
id: REPO-DOC-0002
title: Directory and file ownership
status: draft
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0030]
historical-inputs: [REV-072, REV-074]
---

# Directory and file ownership

The ownership registry assigns each path pattern a semantic owner, allowed
artifact classes, authority, source/generated/vendored status, public/private
visibility, dependency layer, sensitivity, required checks and change triggers.
Filesystem ownership does not create a second human reviewer; the single project
owner fulfils each role while preserving concern separation.

One file has one canonical semantic home. Cross-area views link or generate from
it; copying normative rules is forbidden. Root files are allowlisted. New paths
fail until registered, and overlapping patterns with different owners fail.

Generated files name generator/input/config digests and are changed only by the
canonical task. Vendored bytes retain upstream identity/licence. Test support
cannot be imported by production; benchmarks cannot define product semantics;
scripts cannot contain business logic.

Ownership review is triggered by new public export, package, edition, executable,
workflow, persisted schema, secret boundary or distributed file. Deletion proves
no active graph/evidence/compatibility reference remains.
