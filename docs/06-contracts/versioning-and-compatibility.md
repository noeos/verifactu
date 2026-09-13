---
id: CONTRACT-DOC-0014
title: Contract versioning and compatibility
status: draft
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-13
dependencies: [ARCH-DOC-0015]
---

# Contract versioning and compatibility

Semver governs published code surface; explicit schema versions govern JSON/
NDJSON; regulatory edition governs fiscal/wire behavior; diagnostic/event,
adapter and evidence-profile versions govern their own registries. A release
manifest declares the supported matrix and exact Verification Engine range.

Breaking changes include removal/rename, accepted-input narrowing, output/state/
error reinterpretation, required capability addition, default change, export
map or CLI exit change. Additive union variants may be breaking for exhaustive
consumers and require compatibility evidence. Legal changes create editions;
they do not silently redefine old calls.

Deprecations include replacement, rationale, first/last supporting versions and
migration tests. N/N-1 support is not assumed: each published window is explicit.
Maintained synthetic future-Facturacion host fixtures and real available adapter
implementations run against packed candidates; compatibility claims name exact
contract, fixture, adapter, package and mode versions. When Facturacion is later
built, its consumer-driven fixtures become additive evidence in that repository,
not a retroactive prerequisite for VeriFactu `1.0.0`.
