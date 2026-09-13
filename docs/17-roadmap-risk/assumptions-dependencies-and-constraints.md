---
id: ROADMAP-DOC-0010
title: Assumptions, dependencies and constraints
status: draft
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0051]
---

# Assumptions, dependencies and constraints

Every assumption is falsifiable with owner, evidence/deadline, affected nodes and
safe failure. External dependencies record provider/authority/contact, version/
SLA not controlled, credential/data need, lead time, fallback and exit.

Constraints include single maintainer, public repository/no secrets, Node/npm/
GitHub availability, Engine contract, AEAT certificates/test service, legal
review and the synthetic future-Facturacion UoW contract fixture. Failure never
becomes applicability/success; it blocks,
degrades only explicitly optional behavior or activates a tested contingency.

Facturacion is a future product, not an available external dependency. Its absence
does not block VeriFactu `1.0.0`; the required present evidence is conformance of
the versioned public host contract and maintained synthetic host. Real integration
will be implemented and evidenced later in the Facturacion repository.
