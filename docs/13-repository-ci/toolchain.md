---
id: REPO-DOC-0006
title: Toolchain profiles and integrity
status: draft
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0050, SRC-0056, SRC-0063, SRC-0064]
decisions: [ADR-0029, ADR-0034]
historical-inputs: [REV-067, REV-071]
---

# Toolchain profiles and integrity

| Profile | Baseline | Gate |
|---|---|---|
| minimum | Node 22.14.0 and npm 10.9.2 | required Ubuntu/API compatibility |
| latest-22 | Node 22.23.2 | required latest Node 22 |
| primary | Node 24.21.0, npm 11.19.1, TypeScript 5.9.3 | build/full validation |
| cross-platform | primary on Ubuntu 24.04, Windows 2025, macOS 15 | required |
| current | Node 26.8.2 and npm 12.0.2 | informational |
| reference/provider | exact admitted Python/Java/WASM/native tools | claim-specific |

These are approved planning baselines, not admitted bytes. Before implementation
the manifest MUST verify official checksum/signature, advisory status, licence,
platform asset and Verification Engine compatibility. It pins binary/package
digest and acquisition source. `.node-version`, engines, `packageManager`, lock,
`.npmrc`, CI and docs are generated/validated against it.

Wrappers resolve the executable, reject unexpected PATH/global fallback and
record version/digest. Locale is UTF-8, timezone UTC for deterministic tasks,
and environment variables are an allowlist. Update PRs are isolated, reproduce
generated output and run old/new compatibility. Unsupported versions fail early.
