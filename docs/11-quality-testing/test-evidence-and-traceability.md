---
id: QA-DOC-0018
title: Test evidence and traceability
status: draft
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0026, ADR-0033]
historical-inputs: [REV-063, REV-074, REV-079]
---

# Test evidence and traceability

All harnesses emit versioned deterministic JSON plus human summaries. Common
fields are schema/tool/config digests, repository/commit/tree, package subjects,
lock/toolchain/OS, edition, task/job/workflow/run/attempt, start/end, selection,
executed results, omissions, fixtures/seeds and artifact digests.

Reports are schema- and semantic-validated before aggregation. Aggregation
recomputes counts and graph closure; it does not trust producer summaries.
Evidence for another SHA, rebuilt bytes, expired source edition or unknown
configuration is incompatible. Failed and inconclusive evidence remains
discoverable.

Small manifests/summaries are versioned; large raw artifacts live in an
immutable controlled store with locator, digest, sensitivity, retention and
access policy. Release dossiers reference exact bytes. Personal/fiscal data or
secrets invalidate ordinary publication and trigger incident handling.
