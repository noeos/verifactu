---
id: QA-DOC-0013
title: Security testing
status: approved
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [SEC-INDEX]
sources: [SRC-0034, SRC-0062]
decisions: [ADR-0012, ADR-0027, ADR-0032, ADR-0034]
historical-inputs: [REV-064, REV-075, REV-080]
---

# Security testing

Every threat/control pair maps to a behavioral negative at its real boundary:
untrusted XML/JSON/CLI/path/env, signature wrapping/reference substitution,
XXE/network resolution, zip/path traversal, resource exhaustion, authorization,
secret/log/artifact leakage, dependency/Action tampering and workflow privilege.

SAST/CodeQL, dependency review, OSV, npm audit/signature verification, secret
scanning and Scorecard are complementary signals with pinned tools/config and
machine reports. Scanner error, missing language/build, stale database, ignored
finding or green workflow never proves absence of vulnerability.

Findings carry severity, exploit preconditions, affected subjects, disposition,
fix SLA and regression. Suppression requires narrow expiring `EXC-*` evidence.
Tests assert the intended control and diagnostic, not word presence or generic
failure. Release blocks on unresolved applicable critical/high issues and any
unknown security-tool state.

## OpenSSF Scorecard profile

Scorecard runs weekly and whenever workflow/supply-chain policy changes, using
the independently admitted full SHA corresponding initially to the observed
Verification Engine candidate `ossf/scorecard-action` 2.4.4. The job has only
the documented read, `security-events` and identity permissions needed for its
machine publication; checkout does not persist credentials. JSON and SARIF are
retained with action/config/repository/SHA identities and schema validation.

Every check result becomes evidence or a scoped `FND-*`; overall score, badge,
successful upload and green workflow are not acceptance gates by themselves.
Unsupported/private/inaccessible checks remain explicitly unknown/N/A, and
regressions are reviewed against direct GitHub-state and repository evidence.
