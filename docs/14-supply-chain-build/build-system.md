---
id: BUILD-DOC-0007
title: Build system
status: draft
authority: normative
owner: build-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0030, ADR-0035]
historical-inputs: [REV-065, REV-067, REV-072, REV-084]
---

# Build system

The canonical DAG validates sources, imports pinned editions, generates official
structure/public schemas, compiles once, validates exports/types, stages package
contents, packs three tarballs, tests consumers and generates evidence/SBOM.
Inputs/outputs and a single producer are explicit; stale or undeclared files fail.

Compilation emits ESM/CJS and declarations according to public contracts without
rewriting semantics differently per format. Source maps contain normalized
paths/no source secrets. CLI shebang/mode, schemas, edition manifests/assets,
licences and notices are deliberately staged, never swept by broad glob.

Build reports commit/tree, tool/config/input/output digests and task graph. No
nested lifecycle build, implicit global tool, network after preparation or reuse
of dirty `dist` is allowed. A clean target deletes only resolved registered build
roots and verifies containment.
