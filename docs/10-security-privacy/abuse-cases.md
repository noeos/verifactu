---
id: SEC-DOC-0004
title: Abuse and misuse cases
status: draft
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0003, REQ-DOC-0008]
historical-inputs: [REV-019, REV-027, REV-029, REV-030, REV-075]
---

# Abuse and misuse cases

| ID | Attempt | Required outcome/evidence |
|---|---|---|
| ABU-0001 | reuse idempotency key with altered invoice | conflict; neither chain nor cache changes |
| ABU-0002 | race two records against one predecessor | one append wins; loser rebuilds from fresh head |
| ABU-0003 | cancel another context's record | indistinguishable safe denial; audited correlation |
| ABU-0004 | switch mode during record construction | tenure-compatibility failure; no partial artifact |
| ABU-0005 | submit uncommitted or locally altered bytes | reject before network; corruption evidence |
| ABU-0006 | feed DTD/entity/billion-laughs/deep XML | bounded rejection without resolution or leakage |
| ABU-0007 | wrap signature around attacker-selected element | reference/profile rejection |
| ABU-0008 | configure private, loopback or redirected endpoint | policy rejection before connection |
| ABU-0009 | return huge, slow or malformed authority response | bounded abort; attempt remains reconcilable |
| ABU-0010 | inject CRLF/control data into diagnostic fields | encoded/redacted bounded diagnostic |
| ABU-0011 | expose key through export, stack, env dump or fixture | denied; secret scanning/redaction test fails build |
| ABU-0012 | load catalogue with valid name but wrong digest | startup/install failure; active edition unchanged |
| ABU-0013 | restore old chain head over newer journal | rollback detected; context quarantined |
| ABU-0014 | claim accepted after timeout of uncertain request | indeterminate; reconcile before retry decision |
| ABU-0015 | flood unique tenant/cardinality labels | bounded aggregation, never raw labels |
| ABU-0016 | create pathological decimal/list/Unicode input | preallocation limits and deterministic rejection |
| ABU-0017 | compromise optional adapter | capability-limited port; core invariants revalidate |
| ABU-0018 | remove a critical validation/control | mutation fixture demonstrates CI failure |

Each abuse case becomes an executable security acceptance case with production-
equivalent configuration. Successful defense includes state and disclosure
checks, not merely an expected error code.
