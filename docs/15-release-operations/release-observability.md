---
id: RELEASE-DOC-0016
title: Release observability
status: approved
authority: normative
owner: operations-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0040, ADR-0049]
historical-inputs: [REV-074, REV-079, REV-080, REV-081]
---

# Release observability

Monitor regulatory/source drift, protected GitHub state/check health, npm package/
dist-tag/provenance metadata, GitHub tag/release/assets, advisories/vulnerabilities,
support-line/runtime/Engine compatibility and evidence freshness/restorability.

Signals record exact subject, source, observed time, success/failure/unknown and
owner/SLO. Alert delivery is tested. External outage is separated from absence;
a green schedule with unqueried sources fails. Scorecard changes create scoped
findings, not automatic release revocation or perfection claims.

Telemetry contains no fiscal/personal data, secrets or unbounded labels. Critical
integrity/security/regulatory drift pages immediately and freezes release; other
alerts have documented triage windows and escalation.
