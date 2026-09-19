---
id: INTEGRATION-DOC-0002
title: Verification Engine contract
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0029]
decisions: [ADR-0002, ADR-0021, ADR-0038]
historical-inputs: [REV-015, REV-016, REV-017, REV-019, REV-062]
---

# Verification Engine contract

VeriFactu imports only declared exports of the exact admitted Verification Engine
package. It registers a namespaced, versioned evidence profile describing claims,
artifact digests/relationships and verification outputs; fiscal meanings and
AEAT acceptance remain VeriFactu's responsibility.

Requests contain bounded immutable bytes/metadata and explicit policy/profile;
results preserve per-claim `valid`, `invalid`, `indeterminate`, `unsupported` and
errors without collapsing to a global boolean. Evidence Engine identifiers,
version/config and input/output digests are retained.

No tax type, tenant/user, raw private key, storage handle or network authority
crosses the boundary. Engine exceptions/timeouts/cancellation/resource limits
map to stable diagnostics and cannot be converted to valid. Compatibility is
tested from tarballs; private/deep/source imports and monkeypatching are forbidden.
