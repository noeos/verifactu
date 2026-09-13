---
id: DOM-DOC-0007
title: Compliance-mode lifecycle
status: draft
authority: normative
owner: domain-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0014, PROD-DOC-0005, REG-DOC-0003]
historical-inputs: [REV-015, REV-016, REV-017]
---

# Compliance-mode lifecycle

## States

`unconfigured`, `nonVerifactu`, `transitionPending`, `verifactu`,
`suspendedByFault` and `retired` are explicit states. A `ModeTenure` records
context, state, effective interval, decision source, authorization, configuration
digest, transition evidence and related events. Historical tenures are immutable.

## Transitions

| From | To | Preconditions | Atomic effects |
|---|---|---|---|
| unconfigured | nonVerifactu/verifactu | applicability and required capability proven | initial tenure + event |
| nonVerifactu | transitionPending | authenticated intent and readiness validation | freeze transition parameters + event |
| transitionPending | verifactu | official transition rules satisfied | close/open tenure + event |
| any active | suspendedByFault | integrity/custody/consistency invariant violated | quarantine + event/evidence |
| suspendedByFault | prior/retired | authorized, proven recovery | new tenure, never rewrite old one |
| active | retired | context legally/operationally closed | closure evidence + event |

Any unlisted transition is forbidden. Return from VERI*FACTU to non-VERI*FACTU
is rejected unless the active official edition expressly permits it and a new
decision records the exact conditions; configuration toggles cannot cause it.

## Operation binding

At operation start, the mode tenure and edition are resolved by the fiscal event
time and locked into the command. A concurrent mode transition cannot change an
in-flight record. Commit verifies that the tenure is still compatible; otherwise
the operation retries resolution without reusing a partially built artifact.

## Crash consistency

Transition intent, final tenure, mandatory event and relevant configuration
digest are journaled. Recovery distinguishes not-started, prepared and committed
states. There is never an interval with two effective modes or none. Network
failure cannot roll back a locally committed mode transition.

## Capability rule

Configuration is accepted only if all capabilities required by the target mode
and edition are present and verified. Unsupported combinations fail closed with
an actionable diagnostic and no state mutation.
