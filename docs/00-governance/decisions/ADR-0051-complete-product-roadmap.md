---
id: ADR-0051
title: Dependency-driven complete-product roadmap
status: accepted
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0001, ADR-0026, ADR-0030]
sources: [SRC-0030, SRC-0078]
historical-inputs: [REV-001, REV-084]
---

# ADR-0051: Dependency-driven complete-product roadmap

Implement in dependency-ordered, integration-ready work packages, each leaving
protected main green with exact evidence. Phases express sequence and safe
parallelism, never a reduced stable product. `1.0.0` occurs only after the whole
scope and every gate; dates, effort spent or a happy path cannot close work.

Ready requires authority, decision/contract, oracle/data, risks/dependencies and
acceptance. Done requires packaged implementation, positive/falsifying tests,
security/performance/compatibility, docs and traceable evidence. Unknowns remain
blockers with conservative behavior.

The canonical DAG drives issues, PRs, status and invalidation. Scope change may
add/clarify/replace through impact analysis but cannot silently defer committed
functionality to manufacture completion.
