---
id: ROADMAP-DOC-0016
title: Completion dashboard and status language
status: approved
authority: normative
owner: documentation-owner
created: 2026-09-12
last-reviewed: 2026-10-03
decisions: [ADR-0051, ADR-0052, ADR-0053, ADR-0055, ADR-0056, ADR-0057, ADR-0058, ADR-0060]
historical-inputs: [REV-063, REV-074, REV-080]
---

# Completion dashboard and status language

Generated states are planned, ready, active, blocked, implemented, locally-
verified, CI-verified, externally-observed, published, externally-verified,
supported, deprecated and EOL. Each non-planned state links exact fresh evidence.

“Complete”, “secure”, “compliant”, “green”, “certified” and percentages cannot be
free text without scoped definition. Missing/expired/unknown evidence lowers state;
failed history remains visible. Dashboard is generated from canonical graph and
cannot edit underlying status or hide blocked work.

## Current scoped status

P1, P2, P3, P3-B and the zero-code P4-readiness gate remain evidence-complete
at their recorded protected subjects. P4-A through P4-G implementation is
merged at protected `main` `1f66da46e21127d1d82018cfdf093f595e1c08ae`, but P4
phase closure is blocked: on exact PR head
`2396d87a3748e20a1a02f66a5b4ab21337f758ce`, 14/17 contexts succeeded and the
OSV, npm audit signatures/licences, and derived required-check closure contexts
failed. Protected-push run `37125943358` on merge SHA
`1f66da46e21127d1d82018cfdf093f595e1c08ae` is terminal with the same three
failures; no P4 check remains pending in that read-back. ADR-0060
marks P5 implementation ready to start as serial waves on issue #113's
`work/p5-a`…`work/p5-g` branches. P5 protected
merge and phase closure remain gated; P6–P8 are planned. `creationAllowed=false`
and no fiscal-compliance, AEAT-acceptance, publication or release claim is
made.
