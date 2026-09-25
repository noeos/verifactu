---
id: ROADMAP-DOC-0006
title: Definition of ready
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-25
decisions: [ADR-0051, ADR-0055, ADR-0056, ADR-0057, ADR-0058]
---

# Definition of ready

Ready requires current authority/edition, atomic requirements and acceptance,
accepted governing decisions, public/internal boundary, independent oracle/data,
admitted tool/dependency, threat/privacy/performance analysis, owner/capacity,
upstream availability and migration/rollback.

Ambiguity has a safe explicit behavior and decision deadline. Placeholder API,
unverified source, unavailable mandatory provider, missing negative test or
unowned risk makes work blocked. Readiness expires when any input changes.

Before P4, readiness additionally requires protected P3-B closure and the
approved phase-close control matrix; accepted ADR-0055–0058; explicit host/core,
provider, QR and claim boundaries; and the ready state in
[`p4-quality-plan.md`](p4-quality-plan.md). Its machine manifest must enumerate
every production/test path, critical branch/mutant, campaign, exact OS/runtime/
JDK/Maven/DSS and package identity, performance budget and canonical task.
The required readiness gate and its seeded-negative tests must exist and pass
on protected main before the first P4 implementation commit. A future bridge
module or dependency not in that manifest blocks implementation until a
protected amendment adds it before code.
