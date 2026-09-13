---
id: GOV-003
title: Documentation lifecycle
status: draft
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
historical-inputs: [REV-063, REV-074]
---

# Documentation lifecycle

## Content states

| State | Meaning | May authorize dependent implementation? |
| --- | --- | --- |
| `proposed` | Need identified; research not complete. | No. |
| `researching` | Sources and alternatives are being evaluated. | No. |
| `draft` | A complete proposal exists but remains changeable. | No. |
| `under-review` | Scope is closed and acceptance review is running. | No. |
| `approved` | Required review and gates passed. | Yes, within its scope. |
| `blocked` | A material dependency, contradiction or decision is unresolved. | No. |
| `superseded` | Replaced by an identified newer authority. | No new work. |
| `retired` | Deliberately withdrawn without a direct replacement. | No. |
| `historical-input` | Preserved for history and lessons only. | No. |

## Implementation states

Implementation is tracked independently:

`not-implemented`, `in-progress`, `implemented-unverified`, `verified` or
`blocked`. An approved specification may be `not-implemented`; implemented code
may remain `implemented-unverified`.

## Entry criteria for approval

A document may become `approved` only when:

- its scope, owner, authority and dependencies are explicit;
- primary sources are identified and current for the decision date;
- material alternatives and uncertainty are recorded;
- affected historical documents and findings have dispositions;
- requirements, risks and acceptance criteria are linked;
- no open question can materially alter implementation or claims;
- local and CI documentation gates pass on the exact candidate commit;
- the project owner records approval.

Approval of an area additionally requires every mandatory document in its index
to meet these criteria and an area approval report to exist.

## Change and supersession

Substantive changes to approved content use the impact process. Accepted ADRs
and historical evidence are not rewritten to hide old reasoning; a successor
records what it replaces and why. Editorial corrections cannot alter meaning.

## Freshness

Documents depending on mutable law, platform behavior, dependencies, runtime
support or external services declare `last-reviewed`, `review-by` and review
triggers. Expiry does not rewrite their past status, but produces
`review-required` and blocks affected new claims until reassessed.

## Claim vocabulary

- `specified`: approved desired behavior exists.
- `implemented`: corresponding production code exists.
- `verified-locally`: defined local evidence passed.
- `verified-in-ci`: required evidence passed for an exact commit.
- `validated-externally`: named external system or authority was exercised.
- `published`: identified artifacts are available from the declared channel.
- `operationally-observed`: post-publication behavior was observed.

These terms are not interchangeable.
