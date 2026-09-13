---
id: ARCH-DOC-0015
title: Architecture evolution and compatibility
status: draft
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0009, ADR-0015]
---

# Architecture evolution and compatibility

Package semver, public schema version, regulatory edition, evidence profile,
storage schema and AEAT binding are orthogonal identifiers. A product release
declares their exact compatibility tuple. Multiple installed editions may be
read and verified concurrently; new creation uses an explicitly activated
edition after impact and migration gates.

Public contract removal/narrowing, result/state reinterpretation, export-map
change and stricter accepted input are breaking unless a documented migration
proves otherwise. Additive fields remain unsafe when consumers are exhaustive;
compatibility fixtures decide, not intuition.

Storage migrations are resumable and verified; downgrade cannot write through
an unknown newer schema. Historical bytes/evidence are never rewritten to the
new edition. Rollback means deploying compatible code and resuming recorded
state, not reverting durable fiscal history.
