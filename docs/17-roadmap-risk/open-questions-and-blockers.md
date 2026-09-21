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

## P3-B blocker disposition

| Item                                                                  | Owner             | Due date/gate                                            | P3-B disposition                                                                                              |
| --------------------------------------------------------------------- | ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Authoritative source custody and semantic contract                    | regulatory-owner  | 2026-09-21 P3-B closure                                  | Resolved by the immutable 27-artifact snapshot, generated candidate and independent oracle; drift reopens it. |
| P4 quantitative instrumentation                                       | quality-owner     | First protected P4 commit                                | Policy is complete in `P3B-BASELINE-0001`; omission blocks that commit.                                       |
| Legal/applicability/declaration review                                | legal-owner       | Before P7 external-assurance entry and before release    | Downstream prerequisite; no fiscal behavior or compliance claim exists in P3-B.                               |
| AEAT credentials/test service and provider custody                    | security-owner    | Before the first phase that exercises external transport | Downstream prerequisite; P3-B generation and assurance are offline.                                           |
| Organizationally independent assessment and stable performance runner | assurance-owner   | Before P7 closure                                        | Downstream prerequisite; the P3-B oracle is implementation-independent only.                                  |
| Real Facturacion integration                                          | integration-owner | Separate Facturacion product schedule                    | Explicitly outside VeriFactu P3-B/P4-start authority; the synthetic boundary remains the only current claim.  |

No unresolved row affects authorization to begin P4 under its first-commit
policies. Any scope expansion that makes a downstream row applicable changes it
to `blocked` immediately; absence of a calendar date for a future phase is not
used as evidence that its prerequisite passed.
