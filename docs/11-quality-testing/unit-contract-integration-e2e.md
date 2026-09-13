---
id: QA-DOC-0006
title: Unit, contract, integration and end-to-end suites
status: draft
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0035, ADR-0038]
historical-inputs: [REV-060, REV-062, REV-066, REV-084]
---

# Unit, contract, integration and end-to-end suites

Every production module has focused success/failure/boundary tests. Every public
operation, schema, diagnostic, event and provider port has consumer- and
provider-side contract cases including unknown fields, malformed data,
cancellation, limits and incompatible versions.

Integration tests use compiled outputs, real streams/files/processes and the
lowest real durable/provider implementation needed by the claim. E2E consumers
install actual tarballs in new directories with workspace resolution disabled,
then execute library ESM/CJS, TypeScript declarations, CLI exit/stdout/stderr,
adapter kit, editions/assets and a representative synthetic future-Facturacion
host lifecycle. This does not claim the real application exists.

The suite inventory maps both modalities and all create/correct/cancel/event/
remit/reconcile/export/restore paths. Each matrix cell is executed, explicitly
inapplicable with proof, or blocking. Smoke imports and mocks cannot satisfy a
behavioral cell.

Harness failures are distinct from expected domain rejection. Reports include
discovered and executed IDs so empty filters, unavailable executables and
silently omitted platforms fail.
