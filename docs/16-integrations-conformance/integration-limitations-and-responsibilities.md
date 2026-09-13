---
id: INTEGRATION-DOC-0017
title: Integration limitations and responsibilities
status: approved
authority: normative
owner: product-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0002, ADR-0021, ADR-0038]
historical-inputs: [REV-061, REV-062, REV-083]
---

# Integration limitations and responsibilities

Public claims enumerate guaranteed package/profile/edition/runtime/adapter levels,
required host transaction and authorization, operator configuration/certificates/
connectivity, retention/backup duties and external AEAT/provider dependencies.
Anything outside the matrix is unsupported, not “probably compatible”.

VeriFactu cannot determine legal applicability without correct taxpayer/context,
guarantee AEAT availability/acceptance, protect keys stored by an unsafe provider,
make a non-atomic host atomic, or fulfil operator retention/incident duties by
itself. Verification evidence proves only named claims and time/edition/subject.

The future Facturacion product will own truthful invoice lifecycle/UI and access
control; until it exists, only the synthetic host contract is asserted. Adapters
own declared durability/security; operators own deployment, certificates, clocks,
network, backups and monitoring; Noeos owns shipped code/contracts/vulnerability
response. Limitations are prominent, versioned and tested against package docs/
diagnostics. They cannot disclaim mandatory product behavior that VeriFactu owns.
