---
id: ROADMAP-DOC-0006
title: Definition of ready
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0051]
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
approved phase-close control matrix. The exact P4 quality population, critical
catalogue, thresholds, supported toolchain/OS matrix, performance budgets and
canonical tasks must exist before the first P4 implementation commit.
