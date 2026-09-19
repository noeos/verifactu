---
id: RELEASE-DOC-0001
title: Versioning and regulatory editions
status: approved
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0066, SRC-0067]
decisions: [ADR-0039, ADR-0048]
historical-inputs: [REV-017, REV-074, REV-084]
---

# Versioning and regulatory editions

The three public packages use identical SemVer and exact internal dependencies.
Major changes break API/schema/observable semantics/guarantees; minor adds opt-in
compatible capability/edition; patch corrects behavior without breaking valid
consumers. Security/legal urgency does not change classification.

Edition, evidence profile, storage schema, adapter level and Engine version are
independent matrix axes. Historic editions may be read/verified after new issuance
ends. A release manifest is the sole version source and validates package files,
tag, CLI, schemas, changelog, docs and dossier.

`-rc.N` is prerelease under `next`; stable has no suffix under `latest`. Versions
and changelog entries are never reused or edited. Compatibility diff, clean
consumers and migration evidence approve each increment.
