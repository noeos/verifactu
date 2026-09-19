---
id: ADR-0029
title: Versioned toolchain profiles
status: accepted
authority: decision
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0050, SRC-0056, SRC-0063, SRC-0064]
historical-inputs: [REV-067, REV-071]
---

# ADR-0029: Versioned toolchain profiles

## Decision

Maintain exact authenticated profiles rather than `latest`: minimum Node
22.14.0 with npm 10.9.2, latest supported Node 22, primary Node 24.21.0 with
npm 11.19.1 and TypeScript 5.9.3, cross-platform primary, informational Node 26,
26.8.2 with npm 12.0.2, and separately admitted reference/provider runtimes. The values are planning
baselines until checksums, advisories and Verification Engine compatibility are
revalidated at lock creation.

One manifest generates or validates engines, `packageManager`, `.node-version`,
lockfile producer, CI matrices and documentation. Every executable reports its
resolved path, version and digest; wrappers fail on fallback/global tools.

## Options and consequences

Floating tools gain fixes quickly but make old evidence irreproducible. One old
version is stable but misses supported consumers and security maintenance.
Profiles make compatibility explicit while increasing matrix cost.

## Verification and migration

Negative fixtures cover PATH shadowing, version drift, wrong npm, unsupported
platform and unverified provider binary. Tool upgrades are focused PRs that
regenerate affected outputs and run old/new compatibility; emergency security
updates use a recorded exception, never an unreviewed float.
