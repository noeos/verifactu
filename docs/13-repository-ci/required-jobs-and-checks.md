---
id: REPO-DOC-0015
title: Required jobs and checks
status: draft
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0033]
historical-inputs: [REV-056, REV-058, REV-063, REV-076, REV-079]
---

# Required jobs and checks

Required PR contexts are exactly:

- `Required · governance signatures and DCO`;
- `Required · documentation and traceability`;
- `Required · regulatory sources and generated contracts`;
- `Required · quality and policy`;
- `Required · ubuntu-24.04 · Node 22.14.0`;
- `Required · ubuntu-24.04 · Node 22.23.2`;
- `Required · ubuntu-24.04 · Node 24.21.0`;
- `Required · windows-2025 · Node 24.21.0`;
- `Required · macos-15 · Node 24.21.0`;
- `Required · package reproducibility`;
- `Required · integration conformance`;
- `Required · dependency review`;
- `Required · CodeQL`;
- `Required · secret scan`;
- `Required · OSV`;
- `Required · npm audit signatures and licenses`;
- `Required · required-check closure`.

The machine registry stores exact display/context/job/workflow, expected producer,
events, matrix cell, task/report and timeout. A required workflow change proves
every context is emitted for every PR path, including docs-only and Dependabot.

Closure uses `if: always()` and rejects any prerequisite not successful, absent
cell/report, empty work, schema/digest/SHA mismatch or duplicate producer. Leaf
checks are also ruleset-required. Performance smoke is required when impacted;
scheduled extended campaigns cannot be used to advertise an unrun PR claim.
