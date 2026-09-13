---
id: ROADMAP-DOC-0015
title: Scope change policy
status: draft
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0001, ADR-0051]
historical-inputs: [REV-074]
---

# Scope change policy

Source/regulatory correction, user need, security finding or architecture fact may
add, clarify, supersede or remove only through issue, impact graph, authority/ADR,
risk/version/migration and owner approval. All downstream requirements/tests/docs/
packages/release evidence are invalidated deterministically.

Mandatory capability cannot be silently renamed optional, moved post-1.0 or
deleted to meet schedule. Demonstrated non-applicability is allowed with positive
evidence and reopen trigger. Public scope/change log remains historically visible.
