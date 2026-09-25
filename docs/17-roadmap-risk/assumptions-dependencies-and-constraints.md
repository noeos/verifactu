---
id: ROADMAP-DOC-0010
title: Assumptions, dependencies and constraints
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-25
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

For P4, Facturacion is not a runtime dependency: the future commercial host may
retrieve and cache CRL/OCSP responses, but the library accepts and validates
only explicit bounded evidence offline (ADR-0055). This boundary does not assert
that the commercial host exists or that its retrieval service is implemented.
The selected QR and DSS dependency candidates are exact-version design inputs,
not admitted build evidence; dependency, licence, vulnerability and platform
admission remain P4 readiness work.
