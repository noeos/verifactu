---
id: INTEGRATION-DOC-0005
title: Verification Engine tarball conformance
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0035, ADR-0038]
historical-inputs: [REV-062, REV-066, REV-067]
---

# Verification Engine tarball conformance

Clean temporary consumers install exact VeriFactu and Engine tarballs with both
repositories unavailable. ESM/CJS/types consumers load only export maps, register/
resolve the profile, verify official/negative evidence and exercise malformed,
unsupported, indeterminate, cancellation and resource-bound results.

The harness records both tarball digests, provenance/integrity, resolved trees,
runtime/OS, profile/schema and API result. It compares an independently verified
expected claim set and ensures no tax logic enters Engine or private Engine API
enters VeriFactu.

Rebuilding either tarball reruns the matrix. `file:`/link/workspace resolution,
source maps reaching sibling sources, casts around inaccessible APIs, empty claim
sets and version spoofing fail. Published-registry verification later repeats the
same suite over downloaded bytes.
