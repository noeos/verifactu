---
id: BUILD-DOC-0008
title: Clean and hermetic builds
status: approved
authority: normative
owner: build-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0035]
historical-inputs: [REV-066, REV-067]
---

# Clean and hermetic builds

An authoritative build starts from a clean exact checkout in a fresh absolute
directory with admitted tools and locked verified dependencies. After explicit
input preparation the build runs with network denied, controlled HOME-equivalent
task directory, UTC/UTF-8, fixed epoch/umask and an environment allowlist.

Only declared repository/input paths are readable and only registered output/
temp roots writable. No sibling workspace, global module, prior `dist`, user
configuration, git-untracked source, daemon or mutable cache may influence bytes.

The harness records attempted network and filesystem accesses and compares the
declared graph. Negatives inject global packages, dirty output, alternate locale/
timezone/path and a sibling Verification Engine; output or success MUST not
change. Required nondeterministic signing occurs after reproducible subject
construction and never changes the unsigned subject claim.
