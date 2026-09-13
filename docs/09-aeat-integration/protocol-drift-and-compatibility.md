---
id: AEAT-DOC-0017
title: AEAT protocol drift and compatibility
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
decisions: [ADR-0009, ADR-0024]
sources: [SRC-0016, SRC-0017, SRC-0019, SRC-0020, SRC-0021, SRC-0022]
---

# AEAT protocol drift and compatibility

Monitoring retrieves official index metadata and candidate bytes into
quarantine, then compares digests/dependency graphs for WSDL/XSD, endpoints,
namespaces/actions, fields/facets, validations/errors, limits/wait and examples.
It never changes an installed active edition.

Changes classify editorial, backward-compatible structural, behavior-changing,
breaking, security emergency or ambiguous. Impact maps to requirements/domain,
generators, packages, migrations, vectors, portal scenarios, declaration and
supported dates. A new edition is built and verified alongside historical ones;
activation is explicit per context and in-flight work retains its captured
edition.

Unexpected runtime fields/codes/endpoints are preserved safely and create a
drift finding, not permissive acceptance. Emergency certificate/endpoint action
uses governed source evidence and cannot enable arbitrary URLs. Compatibility
claims name exact old/new editions, operations and migration/reconciliation
states.
