---
id: CONTRACT-INDEX
title: Public contracts documentation index
status: approved
authority: informative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REQ-INDEX, DOM-INDEX, ARCH-INDEX]
historical-inputs: [REV-022, REV-027, REV-047, REV-055, REV-061, REV-084]
---

# Public contracts

Status: all 15 substantive specifications are approved as design authority.
Executable public-client, CLI, schema and adapter-kit evidence remains pending.
Provider and live external observations remain explicit capability cells, not
implied success.

Authority for all public and host-implemented contracts.

Types never substitute runtime validation. Library, CLI, JSON/NDJSON, schemas,
ports and installed package exports must express the same capability and error
semantics from canonical definitions, including resource ownership,
cancellation and serialization fidelity.

Approved specifications (15):

- `public-api.md`
- `operation-lifecycle-and-command-model.md`
- `configuration-and-capabilities.md`
- `cli.md`
- `json-and-ndjson.md`
- `schemas-and-codecs.md`
- `ports-and-adapters.md`
- `host-transaction-contract.md`
- `results-errors-and-diagnostics.md`
- `events-and-observability.md`
- `limits-cancellation-and-ownership.md`
- `exports-and-package-surface.md`
- `editions-sources-and-catalog-access.md`
- `versioning-and-compatibility.md`
- `adapter-conformance-contract.md`

Exit requires a real execution path for every declared command, strict runtime
and round-trip behavior for every public value, honest failure semantics and a
conformance suite that cannot pass without a real adapter.
