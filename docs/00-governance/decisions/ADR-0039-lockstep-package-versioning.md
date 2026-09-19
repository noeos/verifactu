---
id: ADR-0039
title: Lockstep public package versioning
status: accepted
authority: decision
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0007, ADR-0038]
sources: [SRC-0066]
historical-inputs: [REV-066, REV-067, REV-072, REV-084]
---

# ADR-0039: Lockstep public package versioning

Publish `@noeos/verifactu`, `@noeos/verifactu-cli` and
`@noeos/verifactu-adapter-kit` with one lockstep SemVer and exact internal
runtime dependencies. One annotated tag identifies all three source subjects.
The CLI binary is `noeos-verifactu`.

SemVer governs public API, observable behavior and guarantees. Regulatory
editions, evidence profiles, persisted schemas and provider capabilities retain
independent immutable version axes and explicit compatibility matrices. Removing
or reinterpreting a supported edition/guarantee is breaking even if legally
motivated; urgency never justifies mis-versioning.

Independent package versions were rejected because they multiply unsupported
combinations. Lockstep may release unchanged packages, but their rebuilt bytes,
version and evidence remain explicit. Clean consumers and API/behavior diffs
verify classification; reversal requires a major and migration matrix.
