---
id: ARCH-DOC-0007
title: Trust boundaries and data flows
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [SEC-DOC-0002, SEC-DOC-0003, ARCH-DOC-0003]
---

# Trust boundaries and data flows

Boundary crossings are: host input to codec; decoded facts to domain; domain to
edition assets; core to store/UoW; core to XML/XAdES process; key handle to
credential provider; outbox to network; network to bounded parser; durable data
to export/auditor; and VeriFactu projection to Verification Engine.

For each crossing the canonical DFD records data classification, sender,
receiver, authentication/authorization, schema and edition, maximum bytes/count/
depth/time, normalization, replay/idempotency, confidentiality, integrity,
logging prohibition, failure state and retained evidence.

Untrusted zones include the host caller, environment/configuration files,
edition import quarantine, third-party provider output, store contents after a
rollback threat, all network bytes and observer callbacks. “Local” does not
mean trusted. Cross-taxpayer and cross-installation data is rejected at every
port even if the adapter claims prior filtering.
