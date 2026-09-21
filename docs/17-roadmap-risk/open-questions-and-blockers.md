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

## Current P3-B baseline

Protected P1–P3 work now admits the immutable authoritative source snapshot,
deterministic candidate contracts, independent oracle, package shells,
workflows and exact-subject phase evidence described by
[`p3b-evidence.md`](p3b-evidence.md). P4 has not started and fiscal execution,
release and external-acceptance questions remain prospective.

| Question or blocker                                         | Required decision or evidence                                                                         | Impact if unresolved                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Official AEAT source corpus and edition identity            | Resolved for P3-B by the 27-artifact authoritative snapshot; re-observe on every source change        | Reopens P3-B on drift                                                 |
| Legal applicability, declaration and privacy interpretation | Record authoritative decision, scope and responsible reviewer                                         | Blocks affected claims and release                                    |
| Semantic rules beyond XSD structure                         | Seven source/page-located P3 rules are admitted; executable fiscal semantics remain mandatory P4 work | Blocks affected P4 behavior, not P3-B source closure                  |
| Toolchain and external dependency admission                 | P1–P3 profiles, locks, licences, Actions and external tools are admitted; changes reopen their gates  | Blocks P4 on unadmitted change                                        |
| Verification Engine compatibility                           | Inspect the public versioned contract and admit an exact artifact                                     | Blocks integration conformance                                        |
| AEAT certificates, test service and transport               | Confirm authorized non-production access and credential custody                                       | Blocks transport and external-validation evidence                     |
| Independent assurance and performance runner                | Define competent reviewers, workloads, baselines and evidence custody                                 | Blocks assurance and release closure                                  |
| Future Facturacion boundary                                 | Maintain the versioned host contract and synthetic host without claiming the real product             | Blocks only the corresponding conformance claim, not VeriFactu itself |

Each item remains open until its authority, owner, deadline, conservative behavior
and exact unblock evidence are recorded. No later execution observation may be
treated as current without a fresh read-back against the implementation subject.
