---
id: QA-DOC-0015
title: Compatibility testing
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0009, ADR-0029, ADR-0038]
historical-inputs: [REV-066, REV-067, REV-084]
---

# Compatibility testing

The canonical matrix crosses supported Node versions, Ubuntu/Windows/macOS,
ESM/CJS/types, library/CLI/kit packages, regulatory editions, public schema/API,
Verification Engine/profile, store/provider capability levels and versions of the
synthetic future-Facturacion host contract/fixture. Each cell names required,
informational or unsupported status.

Required cells install tarballs in clean consumers and execute behavioral
contracts. Minimum versions are truly exercised; primary cross-platform jobs
cover path case, separators, permissions, process signals and line endings.
Edition and stored-data fixtures remain readable for their support/retention
window even after current defaults change.

Upgrade/downgrade and mixed-version negatives fail early with stable diagnostics;
no unsafe silent fallback. Matrix changes are public compatibility decisions
with migration and release impact. Informational failures become findings and
cannot be used in advertised support claims.
