---
id: ADR-0038
title: Installed-artifact and real-capability integration conformance
status: proposed
authority: decision
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0017, ADR-0022, ADR-0024, ADR-0035]
sources: [SRC-0029, SRC-0046]
historical-inputs: [REV-060, REV-061, REV-062, REV-066, REV-083, REV-084]
---

# ADR-0038: Installed-artifact and real-capability integration conformance

## Decision

Qualify only exact packed/published artifacts through public exports in clean
consumers. Verification Engine is consumed by verified tarball/version/profile,
never a sibling workspace path. Facturacion uses a maintained synthetic host
that exercises the public lifecycle and one joint unit of work without copying
VeriFactu rules.

Each adapter declares a required conformance level and claimed capabilities.
The kit must discover and execute every required claim, inject real supported
faults and validate durable post-state. Empty discovery, mocks for claimed real
capabilities, `unsupported`, unexpected skip or unavailable fault hook cannot
pass. Destructive tests use explicit disposable namespaces.

## Consequences and verification

Real backends/providers cost time and controlled credentials but expose
packaging, atomicity and lifecycle defects. Offline deterministic oracles remain
the merge baseline; credentialled/live observations are separately trusted and
never leak data. Version/profile/storage/provider matrices govern upgrade,
rollback and historical evidence. A replacement contract must pass the same
suite before the old integration is removed.
