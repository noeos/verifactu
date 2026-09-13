---
id: RELEASE-DOC-0007
title: Signed release tags
status: draft
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0041, ADR-0042]
historical-inputs: [REV-073, REV-076, REV-078, REV-082]
---

# Signed release tags

Tags are annotated SSH signatures using dedicated authorized key/principal and
strict grammar. Verification checks tag object, peeled commit, signer validity/
revocation at tag time, protected ancestry, exact package version/channel and
release authorization. Lightweight or recreated tag fails.

Tag ruleset blocks creation outside permitted workflow/actor conditions and all
update/deletion, with no permanent bypass. Trust roots are versioned in protected
verification policy plus encrypted independent recovery custody, not solely the
tagged tree.

Rotation preserves old public keys/status/timeline. Compromise suspends new
release, communicates affected range and uses a new version/key; it never resigns
old tags. Negative tests cover wrong/expired/revoked key and cross-repo replay.
