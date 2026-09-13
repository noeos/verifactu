---
id: ROADMAP-DOC-0005
title: Work package model
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0051]
---

# Work package model

A work package records ID/objective, included/excluded requirements, authority/
ADRs, owner, dependencies, design/files, threat/privacy/performance impact,
positive/negative tests/oracles, generated/package outputs, evidence, migration/
rollback and ready/done criteria.

Packages are bounded vertical increments and one coherent PR where feasible.
Splitting cannot omit integration or create a publicly usable incomplete product.
Unknown dependency or changed scope returns to not-ready. Closure requires exact
squash/evidence linkage; issue closure alone is not done.
