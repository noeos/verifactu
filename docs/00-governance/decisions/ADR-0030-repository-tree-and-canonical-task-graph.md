---
id: ADR-0030
title: Owned repository tree and canonical task graph
status: proposed
authority: decision
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0015, ADR-0016, ADR-0026]
historical-inputs: [REV-065, REV-066, REV-067, REV-072, REV-079, REV-084]
---

# ADR-0030: Owned repository tree and canonical task graph

## Decision

Approve a complete semantic tree before product code. Every path class has one
owner, allowed content, generation status, import direction and verification
rule; generic dumping grounds and private cross-package imports are forbidden.

Define one acyclic task registry with IDs, dependencies, declared inputs/
outputs, locks, environment, network policy, reports and empty-work semantics.
Local scripts and CI call that registry; workflow YAML only supplies event,
matrix and trust orchestration. Compilation and generation occur once per graph
unless isolation is the claim being tested.

## Options and consequences

Organic placement and workflow-specific commands are initially faster but
recreate drift and recursive builds. A monolithic command hides selection and
evidence. The explicit graph costs tooling yet permits impact analysis,
parallelism, caching and exact closure.

## Verification

Static rules test placement/import/export/cycles; negative repositories prove
forbidden dumps and deep imports fail. Task meta-tests detect cycles, undeclared
I/O, duplicate producers, stale outputs, recursive invocation, zero work and
local/CI command divergence.
