---
id: ROADMAP-DOC-0013
title: Phase exit criteria
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-25
decisions: [ADR-0051, ADR-0052, ADR-0058]
historical-inputs: [REV-063, REV-074]
---

# Phase exit criteria

Each roadmap phase lists prerequisites, full deliverables, integrated packaged
tests, security/performance/compatibility impact, evidence freshness, findings/
risks and downstream acceptance. Exit is `evidence-complete` for that bounded
scope, never product/release completion.

Changing authority/contract/tool/implementation invalidates mapped exits. No
percentage complete or date overrides a failed cell. Phase reports enumerate
explicit exclusions that remain committed downstream and block `1.0.0` if orphaned.

## Mandatory measurable close

Every phase closure MUST include an exact-head exit matrix covering every
applicable requirement, test level, percentage, threshold, toolchain profile,
CI context, operating system, security, supply chain, compatibility, audit and
external-observation cell. Each row has `passed`, `blocked` or `failed`, an
owner, a report locator and a digest.

`evidence-complete` is forbidden when a denominator is missing, a percentage
describes only a subset of the declared population, or a test is skipped,
retried, flaky, synthetic or local-only without that limitation being part of
the criterion. A later phase cannot be an implicit repair for an earlier phase.
P3-B is the mandatory readiness gate before P4.

P4 has an additional zero-code readiness gate defined by ADR-0058 and
[`p4-quality-plan.md`](p4-quality-plan.md). Waves close and open serially in
P4-A, P4-B, P4-C, P4-D, P4-E, P4-F, P4-G order; a later wave cannot start from
an unmerged or stale predecessor. Every wave includes its own tests and
evidence, and P4-G is a cumulative rerun/closure rather than first measurement.

The detailed rows are maintained in
[`phase-close-control-matrix.md`](phase-close-control-matrix.md).
