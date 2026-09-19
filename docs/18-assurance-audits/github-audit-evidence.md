---
id: ASSURANCE-DOC-0010
title: GitHub audit evidence
status: approved
authority: normative
owner: assurance-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0031, ADR-0042, ADR-0052]
historical-inputs: [REV-075, REV-076, REV-077, REV-078, REV-080, REV-081]
---

# GitHub audit evidence

Retain paginated redacted API responses/digests for settings, Actions, rulesets/
bypasses, environments, apps/hooks/keys, security features/alerts, workflows/runs
and expected check producers. Each field is verified/absent/inaccessible/unknown/
N/A with time and inheritance.

Desired/effective diff plus negative fixtures prove drift detection. Scorecard
JSON/SARIF is separate signal. Audit jobs are read-only trusted and never execute
PR code; screenshot/manual evidence is used only for fields unavailable by API.
