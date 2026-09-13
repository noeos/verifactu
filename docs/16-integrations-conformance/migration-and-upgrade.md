---
id: INTEGRATION-DOC-0016
title: Integration migration and upgrade
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0009, ADR-0023, ADR-0038]
historical-inputs: [REV-017, REV-032, REV-083, REV-084]
---

# Integration migration and upgrade

The compatibility graph covers VeriFactu, the versioned synthetic future-
Facturacion host contract, Verification Engine, evidence profile, regulatory
edition, persisted schema, adapter/provider and
toolchain versions. Every supported transition declares preflight, backup,
quiescence/concurrency fencing, ordered steps, resumability, verification,
commit point and rollback/forward-repair boundary.

Persisted records/artifacts/evidence remain immutable; migrations add indexes/
metadata or new linked representations, never silently regenerate historic
official bytes. Old editions/profiles/keys/tools needed for verification remain
addressable for retention/support.

Tests interrupt every step, retry, run concurrent old/new processes and inject
incompatible mixes. Preflight refuses missing backup/key/edition/capability and
unknown newer schema. Downgrade is supported only when lossless and proven;
otherwise the diagnostic and recovery route are explicit.
