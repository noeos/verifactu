---
id: AEAT-DOC-0007
title: AEAT batches order and limits
status: draft
authority: normative
owner: integration-owner
created: 2026-09-12
last-reviewed: 2026-09-12
sources: [SRC-0022]
historical-inputs: [REV-037, REV-040, REV-041]
---

# AEAT batches order and limits

Eligibility requires committed records, completed required claims, matching
context/edition/environment/operation, no terminal submission and no unresolved
prior attempt. Selection respects sequence chronology, durable AEAT wait and
edition count/byte rules. Maximum count alone is insufficient; exact serialized
request bytes must remain within limits.

One batch plan freezes ordered record IDs, artifact digests, header identity,
operation, endpoint and correlation manifest. If any member cannot be included,
the planner returns an explicit per-record reason and never silently drops it.
Automatic splitting produces separately identified plans and preserves global
order; parallel send is forbidden where it can violate sequence/wait semantics.

Boundary tests cover zero/one/max/max+1, exact byte ceiling, mixed contexts/
editions/operations, duplicate records, stale/terminal work, construction
failure mid-list and cancellation. The response must account for every expected
member before the batch can leave an indeterminate/partial state.
