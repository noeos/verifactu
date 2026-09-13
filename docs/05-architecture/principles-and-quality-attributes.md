---
id: ARCH-DOC-0002
title: Architecture principles and quality attributes
status: draft
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REQ-DOC-0004, SEC-INDEX, PERF-INDEX]
---

# Architecture principles and quality attributes

## Precedence

When qualities conflict, apply: legal correctness and evidence fidelity;
security/privacy; atomicity/recoverability; deterministic behavior;
compatibility/operability; measured performance; developer convenience. No
optimization may remove validation, custody, durable state or limits.

## Principles

- Make invalid and ambiguous states unrepresentable after decoding; fail closed
  before effects.
- Preserve semantic input, official fields, exact bytes and observations as
  separate attributable facts.
- Keep policy pure and inject every effect, clock, identifier and algorithm.
- Prefer append-only facts, CAS and monotonic transitions over mutable status.
- Bound work at ingress and at each amplification boundary.
- Make cancellation cooperative, observable and unable to erase durable facts.
- Minimize public surface and process privilege while keeping every complete
  capability reachable.
- Produce evidence for the exact commit, edition, toolchain and artifact.

Each principle receives a conformance rule, named exceptions process and tests.
Qualities are evaluated using Lot 1 security/performance budgets; “fast” or
“secure” without a metric, workload and evidence is not an architectural claim.
