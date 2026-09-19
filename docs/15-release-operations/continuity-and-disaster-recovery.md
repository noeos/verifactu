---
id: RELEASE-DOC-0024
title: Continuity and disaster recovery
status: approved
authority: normative
owner: operations-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0048, ADR-0050, ADR-0053]
historical-inputs: [REV-060, REV-079, REV-081, REV-083]
---

# Continuity and disaster recovery

Authoritative copies are protected GitHub plus encrypted complete git/ref mirror,
content-addressed source/tool/package/evidence store, npm public distribution and
documented settings/recovery custody. No required state exists only on one
workstation/service.

Targets: zero loss of protected source/release identities; restore build/test
capability within 24 hours; critical mitigation within published/legal SLA;
historic release verification throughout retention. External AEAT availability
is excluded from owned RTO.

Quarterly verify mirror/random dossier, semiannually restore repository/build/
evidence, annually recover full OIDC publication in isolated namespace, and drill
after platform/owner changes. Results measure RPO/RTO, integrity and deviations;
backup without restore proof fails.
