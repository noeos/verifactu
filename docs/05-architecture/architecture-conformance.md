---
id: ARCH-DOC-0016
title: Architecture conformance
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0016]
historical-inputs: [REV-061, REV-072]
---

# Architecture conformance

The canonical conformance registry will declare rule ID, scope, rationale,
owner, severity, checker, positive fixture, negative fixture and waiver policy.
Required rule classes are package/file placement, dependency direction, cycle
absence, public exports, private deep imports, cross-repository imports,
forbidden ambient APIs, provider isolation, generated-file ownership and size/
complexity budgets.

Checks analyze source and emitted packages, because TypeScript path aliases and
bundlers can hide runtime violations. Clean consumers install packed tarballs
and exercise all exports under every supported module system/runtime.

Critical rules fail closed on checker error, unparsed syntax, unknown package or
stale generated graph. Baselines cannot hide new violations. Exceptions use
`EXC-*`, exact scope, compensating control and expiry; architecture-owner and
project-owner review the machine diff before any rule change.
