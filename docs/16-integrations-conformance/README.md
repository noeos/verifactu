---
id: INTEGRATION-INDEX
title: Integrations and conformance documentation index
status: proposed
authority: informative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-13
dependencies: [CONTRACT-INDEX, ARCH-INDEX, QA-INDEX]
historical-inputs: [REV-060, REV-061, REV-062, REV-066, REV-067, REV-083, REV-084]
---

# Integrations and conformance

Status: all 17 substantive specifications drafted under `PLAN-L3`; formal
approval and executable integration evidence pending

Authority for contracts between VeriFactu and its real hosts and dependencies.
Qualification applies to exact installed artifacts and claimed real
capabilities across the complete product. Workspace imports, permanent mocks,
empty adapters and unsupported operations presented as passing are forbidden.

Substantive documents (17):

- `ecosystem-boundaries.md`
- `verification-engine-contract.md`
- `verification-engine-version-matrix.md`
- `evidence-profile-compatibility.md`
- `verification-engine-tarball-conformance.md`
- `facturacion-host-contract.md`
- `facturacion-publication-lifecycle.md`
- `host-atomicity-contract.md`
- `storage-adapter-conformance.md`
- `retention-and-restoration-conformance.md`
- `xml-xsd-provider-conformance.md`
- `signer-and-certificate-conformance.md`
- `transport-conformance.md`
- `adapter-kit.md`
- `clean-consumer-scenarios.md`
- `migration-and-upgrade.md`
- `integration-limitations-and-responsibilities.md`

Area completion requires explicit ownership and version matrices, real packed
Verification Engine consumers, a maintained synthetic future-Facturacion host, joint
atomic publication/crash proof, capability-level provider/store conformance,
historically safe migrations and precise public limitations. The approved
elaboration contract is in [`PLAN-L3`](../lot-3-assurance-delivery-plan.md).

Facturacion itself is not yet implemented. This area proves the public boundary
needed by that future repository; it neither claims nor requires a real
Facturacion integration for VeriFactu `1.0.0`.
