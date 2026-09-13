---
id: ADR-0050
title: Forward recovery and scoped revocation
status: proposed
authority: decision
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0040, ADR-0044, ADR-0049]
sources: [SRC-0069]
historical-inputs: [REV-074, REV-078, REV-082, REV-083]
---

# ADR-0050: Forward recovery and scoped revocation

Published versions, tags, evidence and declarations are immutable. Recovery
publishes a new verified version, moves dist-tags only after verification,
deprecates affected versions, issues advisory/mitigation and records supersession.
No universal technical revocation of downloaded code is claimed.

Package, signing key, certificate, regulatory edition, evidence profile and
trusted publisher have distinct revoke/suspend states and consumer effects.
Historical bytes remain available/restricted as law/security permits and are
never silently reinterpreted. Unpublish requires official npm eligibility plus
security/legal authorization and preserved evidence.

Drills simulate unknown publish outcome, compromised key/account, bad edition,
non-reproducible build and corrupt evidence. Rollback terminology is reserved
for host deployment; registry correction is forward-only.
