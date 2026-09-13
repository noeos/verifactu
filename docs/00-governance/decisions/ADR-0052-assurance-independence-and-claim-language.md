---
id: ADR-0052
title: Assurance independence and calibrated claim language
status: proposed
authority: decision
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0026, ADR-0047]
historical-inputs: [REV-062, REV-063, REV-074, REV-080]
---

# ADR-0052: Assurance independence and calibrated claim language

Every conclusion labels evidence as owner self-assessment, automated tool result,
independent implementation, external professional review or external authority
observation. Competence, conflicts, scope, date, subject and limitations are
recorded. Internal review, badges, green CI and AEAT test response are never
called certification or general approval.

Public words `complete`, `secure`, `compliant`, `verified`, `certified`, `AEAT-
approved` and compatibility claims require an approved grammar linking exact
version/edition/environment and evidence. Unknown/unavailable scope is stated,
not hidden in an aggregate result.

Claim lint plus deliberately overstated examples test enforcement. A future
formal assessment may add authority but cannot retroactively broaden old evidence.
