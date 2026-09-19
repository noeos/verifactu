---
id: ARCH-INDEX
title: Architecture documentation index
status: approved
authority: informative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [DOM-INDEX, SEC-INDEX, PERF-INDEX]
historical-inputs: [REV-017, REV-026, REV-027, REV-061, REV-072]
---

# Architecture

Status: all 16 substantive specifications are approved as design authority.
Executable conformance evidence and implementation remain pending.

Authority for system decomposition, dependency direction, trust boundaries and
architectural invariants.

The area follows ISO/IEC/IEEE 42010-style explicit concerns, viewpoints and
correspondence rules, using C4 only as a communication notation. Every diagram
must agree with canonical ownership, dependency and dynamic-flow records. The
complete future package/file tree and every forbidden dependency are decided
here before implementation.

Approved specifications (16):

- `architecture-description-and-viewpoints.md`
- `principles-and-quality-attributes.md`
- `system-context.md`
- `package-and-container-view.md`
- `component-view.md`
- `dependency-rules.md`
- `trust-boundaries-and-data-flows.md`
- `dynamic-flows.md`
- `data-ownership-and-lifecycle.md`
- `determinism-and-io.md`
- `configuration-and-isolation.md`
- `concurrency-cancellation-and-resources.md`
- `runtime-deployment-profiles.md`
- `observability-boundaries.md`
- `evolution-and-compatibility.md`
- `architecture-conformance.md`

Exit requires one owner for every component, datum and effect; complete success
and failure views; a fixed package/file and import graph; and an executable
conformance obligation with a negative fixture for every architectural rule.
