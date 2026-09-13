---
id: ROADMAP-DOC-0013
title: Phase exit criteria
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0051, ADR-0052]
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
