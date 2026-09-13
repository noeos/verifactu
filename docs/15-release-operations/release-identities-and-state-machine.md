---
id: RELEASE-DOC-0002
title: Release identities and state machine
status: approved
authority: normative
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0040]
historical-inputs: [REV-074, REV-079, REV-082]
---

# Release identities and state machine

Identity joins authorization ID, source commit/tree, annotated tag object/peeled
commit, three package names/versions/digests, edition/source/toolchain/lock graph,
workflow runs, SBOM/provenance, npm versions/dist-tags, GitHub release/assets and
dossier digest.

Transitions follow `planned→ready→frozen→tagged→built→verified→authorized→
partially-published→registry-verified→channels-updated→github-immutable→
externally-verified→supported`; blocked/aborted/incident/deprecated/EOL are explicit.

Each transition has prerequisites, actor, timestamp source, inputs, observations,
irreversible effects and next/recovery state. Retrying reads actual external state
first. Model tests reject skipped order, stale evidence, conflicting identity,
partial-as-complete and unsupported rollback.
