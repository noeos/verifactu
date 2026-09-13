---
id: REPO-DOC-0008
title: Canonical task graph
status: approved
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0030, ADR-0033]
historical-inputs: [REV-067, REV-071, REV-079]
---

# Canonical task graph

One versioned registry defines task ID/version, owner, dependencies, declared
inputs/outputs, working directory, tool profile, environment, network/secret
policy, timeout, concurrency lock, selection class, report schema and zero-work
semantics. Tasks form an acyclic graph and have one output producer.

Initial groups are `bootstrap`, `generate`, `format`, `lint`, `types`, `unit`,
`contract`, `integration`, `e2e`, `security`, `performance`, `package`, `sbom`,
`provenance-rehearsal`, `docs`, `github-audit` and `closure`. `ci` is a profile,
not duplicated logic. Workflows invoke stable task IDs and pass only declared
matrix parameters.

Tasks write atomically to isolated roots, emit versioned JSON and clean owned
outputs. Cache keys derive only from declared immutable inputs and cache hits are
revalidated. Recursive npm lifecycle invocation and hidden pre/post scripts are
forbidden.

Meta-validation detects cycles, unreachable/duplicate tasks, missing inputs,
undeclared writes/network, empty discovery, stale outputs, wrong report subject
and divergence between documented/local/CI profiles.
