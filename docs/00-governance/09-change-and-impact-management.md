---
id: GOV-009
title: Change and impact management
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
decisions: [ADR-0003, ADR-0004]
historical-inputs: [REV-063, REV-074, REV-075, REV-076, REV-077, REV-078]
---

# Change and impact management

## Classification

Every pull request declares one or more change classes: regulatory, public API,
persisted bytes/data, cryptographic, security/privacy, architecture,
dependency/toolchain, CI/repository policy, performance, operations/recovery,
documentation-only or editorial.

`documentation-only` cannot be used when executable contracts, generated
artifacts, workflows, policies or expected behavior change. `editorial` means
no semantic effect and is verified as such.

## Impact record

Before merge, the change identifies:

- motivation and linked work/decision IDs;
- affected contracts, editions, packages, consumers and operators;
- security, privacy, regulatory and data consequences;
- compatibility, migration, rollback and recovery consequences;
- invalidated tests, evidence, approvals and risk dispositions;
- required documentation, release notes and external coordination;
- validation scope and residual uncertainty.

## Invalidation rules

A content change invalidates prior CI for the changed commit. A change to source
inputs, generator, configuration, dependency lock or toolchain invalidates its
derived artifacts. A regulatory-edition change invalidates every dependent
interpretation and vector. A trust-boundary or persisted-format change triggers
threat-model, migration and recovery review. A required-check definition change
is itself security-sensitive and cannot validate itself as the sole evidence.

## Atomicity

The same change updates affected requirements, ADRs, contracts, tests,
generated views and migration instructions whenever separating them would leave
`main` contradictory or unsafe. Large work may use stacked internal branches,
but protected `main` remains coherent after every merge.

## Dependency and platform events

New upstream versions, advisories, deprecations, legal publications and GitHub
capability changes open bounded impact review; they do not silently alter the
approved baseline. Renovation automation proposes changes but cannot waive
compatibility, provenance or complete CI.

## Post-merge verification

After squash merge, automation verifies the actual `main` commit, branch
deletion and applicable repository state. A mismatch creates a finding and
blocks release until reconciled.
