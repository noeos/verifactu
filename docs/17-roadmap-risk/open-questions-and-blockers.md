---
id: ROADMAP-DOC-0011
title: Open questions and blockers
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-16
decisions: [ADR-0051]
---

# Open questions and blockers

Records include question, governing authority/decision maker, alternatives,
known evidence/conflict, conservative interim behavior, impacted claims/work,
owner/deadline/escalation and unblock evidence. Material legal/fiscal/security/
integrity uncertainty blocks mutation/release.

Questions cannot live only in prose/issue comments. Overdue/unknown authority and
decisions made without evidence appear in generated status. Resolution updates
requirements/ADR/tests/risks; deletion without disposition fails.

## Initial implementation baseline

No implementation phase has started. No official source snapshot, generated
regulatory edition, independent oracle, executable contract, package, workflow
or phase evidence is currently admitted by this document.

The initial blockers and open questions are therefore prospective:

| Question or blocker | Required decision or evidence | Impact if unresolved |
| --- | --- | --- |
| Official AEAT source corpus and edition identity | Acquire, license, digest and index every mandatory source before P3 closure | Blocks regulatory contracts and any edition-bound implementation |
| Legal applicability, declaration and privacy interpretation | Record authoritative decision, scope and responsible reviewer | Blocks affected claims and release |
| Semantic rules beyond XSD structure | Produce source-located requirements, generated contracts and independent oracle cases | Blocks P4 readiness |
| Toolchain and external dependency admission | Freeze supported profiles, versions, digests and fallback behavior | Blocks reproducible implementation and CI |
| Verification Engine compatibility | Inspect the public versioned contract and admit an exact artifact | Blocks integration conformance |
| AEAT certificates, test service and transport | Confirm authorized non-production access and credential custody | Blocks transport and external-validation evidence |
| Independent assurance and performance runner | Define competent reviewers, workloads, baselines and evidence custody | Blocks assurance and release closure |
| Future Facturacion boundary | Maintain the versioned host contract and synthetic host without claiming the real product | Blocks only the corresponding conformance claim, not VeriFactu itself |

Each item remains open until its authority, owner, deadline, conservative behavior
and exact unblock evidence are recorded. No later execution observation may be
treated as current without a fresh read-back against the implementation subject.
