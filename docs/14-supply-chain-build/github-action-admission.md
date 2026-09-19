---
id: BUILD-DOC-0003
title: GitHub Action admission
status: approved
authority: normative
owner: supply-chain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0052]
decisions: [ADR-0032, ADR-0034]
historical-inputs: [REV-075, REV-080]
---

# GitHub Action admission

Each Action/reusable workflow record binds owner/repository, exact full commit
SHA, reviewed tag/release ancestry, source tree digest, licence, runtime, inputs/
outputs, permissions, network, credential handling, generated/bundled code and
known advisories. Tags are comments only and never executed references.

Prefer GitHub-owned minimal Actions, then maintained open-source Actions whose
source/bundle can be inspected; replace simple risky Actions with owned locked
tasks. Platform selected-Action allowlist and `sha_pinning_required` supplement,
not replace, parsed workflow enforcement.

Updates prove SHA ownership from upstream git, review semantic/bundle diff and
run malicious-input/permission tests. Archived/transferred repository, unexplained
bundle, broad write/OIDC, mutable download or incompatible runtime blocks.
