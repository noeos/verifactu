---
id: RELEASE-DOC-0014
title: External AEAT validation
status: draft
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0016, SRC-0017, SRC-0022]
decisions: [ADR-0024, ADR-0052]
historical-inputs: [REV-037, REV-038, REV-039, REV-040, REV-041, REV-042, REV-043, REV-044]
---

# External AEAT validation

Registry maps every officially available test/portal operation, modality,
certificate identity, edition, endpoint and positive/negative/correlation/
retry/reconciliation scenario. Test fiscal identities/data are authorized and
synthetic; keys/responses are restricted and exact request/response bytes retained.

Execution verifies local deterministic vectors first, uses no hidden retry and
records authority time/environment/status plus limitations. Portal availability,
nonproduction response or one accepted example is not certification or production
guarantee. Unexpected/unknown/unavailable remains explicit.

Before `1.0.0`, every available claimed surface executes and material unavailable
scope has authoritative/legal disposition; otherwise stable release blocks.
Credential renewal, endpoint/schema change and anomalous response invalidate the
affected evidence and trigger regulatory monitoring.
