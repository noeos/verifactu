---
id: BUILD-DOC-0011
title: Tarball consumer verification
status: approved
authority: normative
owner: quality-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0035, ADR-0038]
historical-inputs: [REV-066, REV-067, REV-084]
---

# Tarball consumer verification

Fresh temporary projects install only exact tarballs after the repository and
sibling workspaces become inaccessible. Scenarios cover supported Node/npm,
ESM import, CJS require where promised, TypeScript declarations/exports, CLI
spawn/streams/signals/exit codes, adapter-kit and installed edition/schema assets.

Consumers execute representative real operations and compare public behavior/
diagnostics, not just import success. Negative cases attempt private deep import,
undeclared file access, unsupported version/module mode, missing peer/provider,
tampered tarball and workspace alias resolution.

Reports bind tarball digest, generated consumer files/lock, resolved package tree,
runtime/OS and commands. Network is denied after local install preparation. Any
fallback to repository source, `file:`, symlink or global package fails.
