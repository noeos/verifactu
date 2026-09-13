---
id: GOV-007
title: Decision process
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
decisions: [ADR-0003]
historical-inputs: [REV-063, REV-074]
---

# Decision process

## When an ADR is mandatory

An ADR is required before implementing a choice that changes regulatory
interpretation, public contracts, trust boundaries, persisted or signed bytes,
cryptography, privacy, architecture, supported platforms, supply chain,
availability, recovery, material performance budgets or repository controls.
It is also required for a deliberate exception to an approved rule and for a
choice that is costly or unsafe to reverse.

Routine implementation inside an approved design needs traceable requirements
and tests, not an ADR for every line. Uncertainty about whether a decision is
material is resolved in favour of recording it.

## Workflow

1. Open a proposed ADR with one precise question and named decision owner.
2. Link constraints, sources, requirements, threats, risks and historical
   lessons; distinguish verified fact from inference.
3. Compare feasible options, including retaining the current state, using the
   same criteria and realistic failure modes.
4. Define security, privacy, regulatory, compatibility, performance,
   operability and reversal consequences.
5. Define evidence that would validate or falsify the recommendation.
6. Resolve material objections or mark the record `blocked`.
7. Accept the ADR through the protected change path.
8. Update all affected specifications and generated views atomically.

## ADR lifecycle

`proposed -> accepted | rejected | blocked`; an accepted ADR may later become
`superseded` only through a successor ADR. Accepted and rejected records are
immutable historical decisions except for clearly labelled clerical corrections
that do not alter meaning.

An ADR records a decision, not proof that it was implemented. Its verification
section identifies obligations whose results live in evidence records.

## Decision quality

A valid comparison includes constraints, benefits, disadvantages, operational
burden, failure modes, adoption cost, exit cost and residual risks. It must not
invent token alternatives, hide the preferred option's costs or use popularity
as proof. Where an option is ruled out by law or an invariant, cite the exact
authority rather than scoring it artificially.

## Emergency decisions

Urgency does not authorize undocumented permanent design. A time-bounded
emergency exception follows `GOV-010`, preserves evidence and requires a
retrospective ADR before normal operation resumes.
