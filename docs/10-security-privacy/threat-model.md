---
id: SEC-DOC-0003
title: Threat model
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0002, ADR-0012]
historical-inputs: [REV-009, REV-010, REV-011, REV-012, REV-013, REV-014]
---

# Threat model

## Method

Threats are elicited per data flow using spoofing, tampering, repudiation,
information disclosure, denial of service, privilege escalation, privacy harm
and supply-chain compromise. Severity combines plausible impact and exploit
preconditions; it is not reduced because a control is planned. Each record has
asset, actor, path, precondition, impact, controls, verification and residual
risk. Review occurs for every boundary/edition/dependency change and quarterly.

## Threat register

| ID | Threat and impact | Primary controls | Proof |
|---|---|---|---|
| THR-0001 | forged/ambiguous context causes cross-taxpayer action | CTL-0001, CTL-0002 | isolation/property tests |
| THR-0002 | record or chain tampering/reordering | CTL-0003, CTL-0004 | vectors, tamper and recovery tests |
| THR-0003 | XML entity/DTD, expansion or parser differential | CTL-0005 | malicious corpus |
| THR-0004 | signature wrapping, transform or algorithm confusion | CTL-0006 | adversarial signature fixtures |
| THR-0005 | SSRF/DNS redirect to unintended endpoint | CTL-0007 | network-negative tests |
| THR-0006 | TLS/certificate identity weakened or bypassed | CTL-0008 | controlled TLS matrix |
| THR-0007 | private key/token disclosure or cross-purpose use | CTL-0009 | custody/permission tests |
| THR-0008 | oversized/deep input, queue or response exhausts resources | CTL-0010 | hostile load tests |
| THR-0009 | sensitive data leaks through logs/errors/artifacts | CTL-0011 | taint/redaction scans |
| THR-0010 | replay/duplicate/race corrupts fiscal state | CTL-0012, CTL-0004 | concurrency/model tests |
| THR-0011 | compromised dependency/build publishes malicious artifact | CTL-0013 | provenance/policy tests |
| THR-0012 | stale/forged regulatory source changes behavior | CTL-0014 | digest/drift tests |
| THR-0013 | forged/truncated authority response changes status | CTL-0007, CTL-0015 | response corpus/reconciliation |
| THR-0014 | clock rollback/ambiguity corrupts chronology | CTL-0016 | clock fault injection |
| THR-0015 | privileged maintainer/adapter suppresses evidence | CTL-0017 | append/audit/tamper tests |
| THR-0016 | crash between record/head/artifact creates split state | CTL-0004 | exhaustive crash points |
| THR-0017 | cache/global mutable state crosses context or edition | CTL-0002 | interleaving tests |
| THR-0018 | diagnostic/catalogue confusion bypasses fail-closed path | CTL-0018 | mutation/negative tests |

## Acceptance

Critical threats require preventive and detective controls plus a failing
negative fixture. “Trusted caller”, obscurity, documentation alone, a scanner
alone or transport encryption alone are not sufficient mitigations. Accepted
residual risk follows `SEC-DOC-0015`; unknown critical exposure blocks release.
