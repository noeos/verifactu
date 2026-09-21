---
id: GOV-DOC-0021
title: Governed implementation changelog
status: active
authority: normative
owner: project-owner
created: 2026-09-21
last-reviewed: 2026-09-21
dependencies: [ROADMAP-DOC-0017, ROADMAP-DOC-0020]
decisions: [ADR-0026, ADR-0053]
---

# Governed implementation changelog

This log records protected phase transitions. It is not a product release
changelog and makes no compliance, publication or support claim.

## 2026-09-21 — P3-B pre-P4 assurance

- Protected prerequisite observation PR `#31` added bounded normal-TLS source
  observation on Ubuntu, Windows and macOS.
- Protected implementation PR `#32` admitted a 27-artifact immutable source
  snapshot, deterministic structural candidate contracts, an independent
  Python oracle and the mandatory `gate:p3b` campaign.
- Exact populations, thresholds, the critical catalogue, all 84 REV
  dispositions and P4 first-commit quality policies are canonical and
  fail-closed.
- Fiscal runtime implementation remains absent. The candidate remains
  `creationAllowed=false`; P4 is authorized only under the frozen first-commit
  controls after protected handoff PR `#33` and forward-correction/read-back PR
  `#34` are green on their exact required subjects.
- PR `#33`'s protected squash retained a literal escaped newline instead of a
  canonical DCO trailer, and its protected-push governance check failed. The
  required closure check consequently failed. Both failed results are retained;
  PR `#34` forward-corrects the latest protected subject with a canonical
  signed-off trailer and reruns the complete matrix.
