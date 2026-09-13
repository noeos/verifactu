---
id: RELEASE-DOC-0004
title: Change freeze and candidate selection
status: approved
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0040, ADR-0041]
historical-inputs: [REV-074, REV-079]
---

# Change freeze and candidate selection

Freeze records final protected commit/tree, version, lock/toolchain, editions,
source digests, Engine/profile, compatibility/support matrices and all policy/
test/report schemas. Candidate selection occurs through a focused signed+DCO PR
whose checks run on its final head.

Only an annotated authorized tag may select the frozen commit. Any byte/policy/
finding/evidence change creates a new freeze and tag; retagging is forbidden.
Embargoed security content is stored restricted but its digest/gates remain in
the public-safe manifest.

The checker proves clean tree, main ancestry, exact versions and absence of later
unreviewed commit. Time pressure cannot narrow scope; abort preserves evidence and
returns to an explicit state.
