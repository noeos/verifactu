---
id: PERSIST-DOC-0013
title: Retention archival and purge
status: approved
authority: normative
owner: persistence-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [REG-DOC-0009, SEC-DOC-0011]
historical-inputs: [REV-025, REV-083]
---

# Retention archival and purge

Retention policy is per data class, jurisdiction/applicability, fiscal period,
legal hold, evidence dependency and privacy purpose. The retained closure
includes records/events, exact artifacts, signatures/certificates/validation
data, edition/source manifests, chains/heads, submissions/responses, journal,
checkpoints and declarations needed for verification.

Archive is an authenticated, indexed, readable format with manifest, counts,
ordering, digests, dependency closure and access-control metadata. Moving to
archive does not break public inspection/export or idempotency/reconciliation.
Access is authorized/audited and can stream within resource limits.

Purge is a governed command requiring expired minimums, no hold, dependency
analysis, approval evidence and a non-secret tombstone. It never rewrites chain
history or removes bytes still referenced by evidence. Dry run enumerates exact
objects/reasons. Negative tests prove holds, unknown policy, partial archive and
missing edition/key evidence block deletion.
