---
id: AEAT-DOC-0014
title: AEAT consultation and required submission
status: approved
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0016, SRC-0017, SRC-0019, SRC-0022]
historical-inputs: [REV-024, REV-037, REV-042]
---

# AEAT consultation and required submission

Consultation is a first-class edition-bound service with explicit filters,
identity/authentication, pagination/continuation, result ordering, completeness
and limits. It supports operator inspection and reconciliation only within
officially documented semantics; it cannot be replaced by local state.

Authority-requested/non-VERI*FACTU submission is separately modeled: selection
scope, required event/record set, XAdES/artifact requirements, ordering,
deadline, transport operation, receipt and evidence. It cannot reuse voluntary
submission while omitting its asymmetric obligations.

All pages/responses are retained and correlated to one query/request manifest.
Missing page, repeated cursor, changing snapshot, foreign context or incomplete
result returns indeterminate. Tests cover empty/one/many pages, maximum filters,
boundary periods, correction/cancellation records, mixed statuses, resume after
crash and certificate/authorization failure. Edition capability explicitly
blocks any officially unavailable query.
