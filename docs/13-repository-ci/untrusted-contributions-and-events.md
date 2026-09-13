---
id: REPO-DOC-0017
title: Untrusted contributions and events
status: draft
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0052]
decisions: [ADR-0032]
historical-inputs: [REV-075, REV-078, REV-080]
---

# Untrusted contributions and events

Fork PR contents, branch/ref/title/body/labels, issue/comment text, changed files,
artifacts and caches influenced by them are attacker-controlled. They MUST NOT be
interpolated into shell, executable filenames, expressions with privilege or
configuration evaluated by a privileged process without strict typed handling.

`pull_request` runs safe validation with no secrets/write/OIDC. `pull_request_target`
is forbidden for checkout/execution of PR code and for consuming PR artifacts or
executable caches; if later used for metadata, it uses base code, API-safe values
and read/minimal scoped permission. `workflow_run` never elevates an untrusted
producer.

Dependabot has the same untrusted execution boundary even when repository-owned.
External collaborators cannot trigger privileged manual jobs on arbitrary SHA.
Caches are partitioned by trust and main/release never restore PR-writable keys.

Adversarial fixtures cover shell/expression/newline/ref injection, symlink/path
escape, poisoned package scripts, cache/artifact substitution and log commands.
