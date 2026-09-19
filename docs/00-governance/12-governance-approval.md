---
id: GOV-012
title: Governance approval plan
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
decisions: [ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006]
historical-inputs: [REV-001, REV-084]
---

# Governance approval plan

## Design decision

The project owner approved the governance design and its single-maintainer
change model on 2026-09-11. This authorizes creation of the governance package;
it is not evidence that its controls already execute.

## Package exit criteria

Operational governance becomes `effective` only when all of the following are
true on one identified commit:

1. `GOV-001` through `GOV-012`, all referenced ADRs and templates are complete
   and mutually consistent;
2. every relevant `REV-001` through `REV-084` has an explicit disposition or a
   governed assignment to a later documentation area;
3. metadata, identifier, reference and transition schemas are machine-readable;
4. deterministic local commands and CI implement `GOV-011`;
5. negative fixtures prove every critical gate fails closed;
6. desired GitHub rules, workflows, permissions and automatic branch deletion
   are versioned and checked against effective API state;
7. SSH commit signature and DCO gates reject their negative fixtures;
8. the bootstrap commit, if used, is signed, signed off, minimal and recorded;
9. required checks pass for the exact candidate SHA and their evidence is
   retained;
10. the owner records final approval without an unresolved material finding.

## Pre-P1 disposition

The governance design and its single-maintainer change model were approved by
the project owner on 2026-09-11. P1 has not started in this baseline. The
executable checker, negative fixtures, least-privilege workflow, effective
GitHub enforcement and exact commit evidence are required outputs of P1 and are
not claimed here. Approval of this document authorizes the design; it does not
claim that any governance control or product capability is implemented.

## Approval evidence

The future approval report must list subject SHA and tree, PR, squash commit,
signatures, DCO result, exact required checks and conclusions, toolchain lock,
historical disposition summary, effective repository-policy snapshot,
exceptions and residual risks. Claims will be limited to that recorded scope.

## Reapproval triggers

Material changes to authority, lifecycle, role model, main-branch flow,
signature/DCO rules, exception policy, identifier semantics or quality gates
require a successor decision, impact analysis and governance reapproval.
