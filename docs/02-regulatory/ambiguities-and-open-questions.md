---
id: REG-DOC-0007
title: Regulatory ambiguities and open questions
status: draft
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
decisions: [ADR-0008, ADR-0009, ADR-0014]
historical-inputs: [REV-001, REV-002, REV-004, REV-006, REV-022, REV-023, REV-037, REV-039, REV-040, REV-041]
---

# Regulatory ambiguities and open questions

This is a controlled blocking register, not a dumping ground for `TBD` text.
Every entry receives an `FND-*` or research ID, exact scope, competing readings,
authority, impact, owner, due/review date and closure evidence.

## Questions requiring explicit edition resolution

| Topic | Required resolution before approval | Default while unresolved |
| --- | --- | --- |
| Complete AEAT validation coverage | Reconcile order/annex, XSD, validation document, FAQ and observed responses; generate rule manifest. | Block claim of complete generation/validation. |
| Predecessor after local generation, rejection or indeterminate delivery | Derive exact generation-chain rule and separate it from AEAT submission status. | Preserve generated order; block any destructive rechain/replay. |
| First effective VERI*FACTU activation | Define relationship among intent, first attempt, possible delivery and confirmed systematic transmission. | Record indeterminate tenure evidence; no silent mode fallback. |
| Renunciation/final date | Pin official message field, permitted timing and year-duration semantics. | Continue current verified tenure. |
| Exceptional authorization/missing data | Model authorization identity, scope, validity and representation effect. | Reject omission without evidence. |
| Signature certificate validation | Define required certificate/chain/time/revocation evidence and offline/online boundaries from official specs and applicable trust law. | Refuse a `valid` claim when evidence is insufficient. |
| AEAT omitted/duplicate/inconsistent item response | Establish correlation and consultation behavior. | `indeterminate`; never infer acceptance. |
| Retention versus erasure/restriction | Obtain data-category/purpose-specific legal analysis and controller procedure. | Preserve legally required evidence, restrict access, avoid unrelated copies. |
| Multi-installation/sequence boundaries | Resolve official identity/chain implications for migrations and distributed generation. | Prevent concurrent generation where a unique ordered boundary is unproved. |

## Closure quality

Community consensus, old implementation behavior, a single successful request or
absence of error is insufficient. Closure requires cited authority, approved
interpretation, updated edition/requirements/tests and negative evidence. If
authority genuinely permits alternatives, the product policy and consequences
are documented rather than calling the question legally settled.

## Release effect

Any open question that can change applicability, official bytes, signature,
chain, mode, retention, submission state or declaration blocks the affected
stable release. Lower-impact uncertainty appears in the release dossier with
bounded scope and review trigger.
