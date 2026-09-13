---
id: ADR-0014
title: Explicit per-taxpayer compliance-mode tenure
status: accepted
authority: decision
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-12
supersedes: []
requirements: [REG-0020, FUN-0020, SEC-0020]
risks: [RISK-0008]
---

# ADR-0014: Explicit per-taxpayer compliance-mode tenure

## Context

VERI*FACTU choice has duration and asymmetric effects. A process-global boolean
cannot represent multiple taxpayers, adoption, renunciation or historical mode.

## Decision

Mode is a dated `ComplianceModeTenure` inside one taxpayer/installation context.
There is no permissive default. Activation requires explicit authorized intent
and effective evidence. Renunciation records its final effective date and cannot
rewrite prior tenure. Operations select mode by generation time and immutable
tenure, never current configuration alone.

## Consequences and verification

Multi-taxpayer hosts can operate different modes without cross-contamination.
Boundary dates, restarts, clock anomalies, failed first transmissions,
renunciation and year-spanning cases require state-machine and persistence tests.
