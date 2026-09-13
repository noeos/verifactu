---
id: INTEGRATION-DOC-0015
title: Clean integration consumer scenarios
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0035, ADR-0038]
historical-inputs: [REV-062, REV-066, REV-067, REV-084]
---

# Clean integration consumer scenarios

Consumers install the three VeriFactu tarballs and exact Engine/provider packages
from a local verified artifact set into new projects after workspace/sibling
sources are inaccessible. Scenarios cover ESM/CJS/TS, CLI, edition discovery,
profile verification, adapter kit and synthetic future-Facturacion issue/correct/cancel/
submit/reconcile/export flows.

Assertions cover public exports/types, exact bytes/digests, durable state/events,
diagnostics, cancellation/resources and absence of private imports. Unsupported
runtime/version/profile/provider combinations fail with the documented error
before side effects.

The harness scans resolution/loaded files and rejects `file:`, symlink, path alias,
source-tree and global fallbacks. It records every artifact/install lock/runtime/
OS/command. Both packed-build and later registry-download variants use identical
behavioral scenarios.
