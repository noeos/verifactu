---
id: CONTRACT-DOC-0003
title: Configuration and capability contracts
status: approved
authority: normative
owner: api-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ARCH-DOC-0011]
---

# Configuration and capability contracts

Configuration contains schema version, fiscal context, installation/product
identity, explicit mode tenure reference, edition ID/digest, environment,
limits, provider references and observability policy. It is decoded with closed
schemas; unknown fields, duplicated JSON members, incompatible versions and
secret-looking raw values fail before client creation.

Capabilities are narrow frozen interfaces with `kind`, contract version,
implementation identity and supported feature level. Required capabilities are
clock/identifier source, host UoW, record/artifact/evidence/outbox/head stores,
XML/XSD, digest, XAdES/certificate, Verification Engine and AEAT transport as
needed by the selected mode. Optional absence yields `capability-unavailable`,
never silent degradation.

Availability/health probes are explicit read-only operations with timeouts and
do not establish authorization or future success. Configuration logs expose
only safe field presence and stable IDs, never credential handles, taxpayer
data or endpoint overrides.
