---
id: CRYPTO-DOC-0015
title: Verification Engine adaptation
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0029]
historical-inputs: [REV-015, REV-020, REV-021]
---

# Verification Engine adaptation

VeriFactu depends on the exact published `@noeos/verification-engine` package
and documented root/profile/schema/vector exports; source, internal paths and
shared stores are forbidden. The compatibility manifest pins package/tarball
digest, public API/profile versions, Node/module matrix and known constraints.

The adapter maps the namespaced profile to `createEngine` operations, supplies
only explicit deterministic inputs and converts every Engine result/diagnostic
without promoting it. Returned evidence bytes/schema/version/digests are
runtime-validated and independently verified through the public verification
operation before VeriFactu commit.

Clean consumers pack/install both projects and run profile vectors under ESM
and CJS as supported. Tests cover missing/extra/old/new profile, malformed or
swapped evidence, wrong context/predecessor/artifact digest, Engine
unavailability/cancellation and absence of personal data. Upgrades require
compatibility and historical verification evidence.
