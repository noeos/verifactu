---
id: ROADMAP-INDEX
title: Roadmap and risk documentation index
status: approved
authority: informative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-10-03
dependencies: [GOV-INDEX, REQ-INDEX]
historical-inputs: [REV-001, REV-084]
---

# Roadmap and risk

Status: all 22 substantive specifications are approved as design authority under
`PLAN-L4`; P1–P3-B and the zero-code P4-readiness gate are evidence-complete at
their recorded protected subjects. P4-A…P4-G implementation is merged on
protected `main` `1f66da46e21127d1d82018cfdf093f595e1c08ae`, but P4 phase closure
is incomplete. Under ADR-0060, P5 implementation may start as serial vertical
waves on issue #113's `work/p5-a` through `work/p5-g` branches; the cumulative
`work/p5-implementation` branch is staging only. P4 is not evidence-complete,
and protected P5 merges and P5 closure remain gated.

Authority for dependency-driven execution, readiness, completion and visible
risk. Phases order work; they do not reduce final scope.

Substantive documents (22):

- `delivery-principles.md`
- `dependency-map.md`
- `sequencing-and-critical-path.md`
- `implementation-roadmap.md`
- `handoff.md`
- `prompts.md`
- `work-package-model.md`
- `definition-of-ready.md`
- `definition-of-done.md`
- `risk-method.md`
- `risk-register.md`
- `assumptions-dependencies-and-constraints.md`
- `open-questions-and-blockers.md`
- `issue-and-pull-request-mapping.md`
- `phase-exit-criteria.md`
- `p3b-pre-p4-assurance.md`
- `p4-quality-plan.md`
- `p5-quality-plan.md`
- `phase-close-control-matrix.md`
- `release-1.0.0-criteria.md`
- `scope-change-policy.md`
- `completion-dashboard-and-status-language.md`

Exit requires a complete dependency graph, current risks/assumptions/blockers,
work readiness/done and phase invalidation, and a `1.0.0` gate with no orphan or
MVP deferral. See [`PLAN-L4`](../lot-4-release-assurance-closure-plan.md).
