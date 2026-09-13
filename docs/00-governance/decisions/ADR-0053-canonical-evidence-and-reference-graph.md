---
id: ADR-0053
title: Canonical retained evidence and reference graph
status: proposed
authority: decision
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0026, ADR-0036, ADR-0040]
historical-inputs: [REV-063, REV-068, REV-074, REV-079, REV-083]
---

# ADR-0053: Canonical retained evidence and reference graph

One append-only typed graph links sources, requirements, decisions, risks,
implementation, tests/jobs/reports, findings/exceptions, releases/packages,
declarations and audits. Raw evidence is content-addressed with custody, access,
sensitivity, retention/legal hold and restoration proof.

Audit matrices, glossary, catalogues, dashboards and release indexes are
deterministic views carrying input/generator digests. They cannot introduce facts
or be hand-edited. Historic schemas/tools/trust material remain available for
their claim/support/legal lifetime; migrations preserve original bytes.

Negative fixtures delete/swap/orphan evidence, alter generated views and simulate
expiry/corruption/restore. Storage cost is accepted to prevent unverifiable
claims; lawful minimization/deletion uses class-specific policy, never one global
retention number.
