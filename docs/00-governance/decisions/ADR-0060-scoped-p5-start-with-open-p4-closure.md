---
id: ADR-0060
title: Scoped P5 implementation start with P4 phase closure outstanding
status: accepted
authority: decision
owner: project-owner
created: 2026-10-03
last-reviewed: 2026-10-03
dependencies: [ADR-0051, ADR-0058]
---

# ADR-0060: Scoped P5 implementation start with P4 phase closure outstanding

## Question and context

May P5 implementation begin when P4 has been merged but its phase-level
protected closure is incomplete because the P4 PR required-check closure failed
on three known contexts?

P4 PR #109 was squash-merged to protected `main` as
`1f66da46e21127d1d82018cfdf093f595e1c08ae`. On its exact PR head,
`2396d87a3748e20a1a02f66a5b4ab21337f758ce`, the required contexts
`Required · OSV` and `Required · npm audit signatures and licenses` failed;
`Required · required-check closure` consequently failed. The one-time merge
exception is recorded in EXC-0001 / issue #112 and is closed. The `protected-main`
ruleset is restored with all 17 required contexts.

The dependency audit identified transitive packages beneath the pinned npm
installation: `brace-expansion@5.0.9`, `ip-address@10.5.0` and `undici@6.28.0`.
The failed scanners and their underlying findings remain open for remediation;
this decision does not alter scanner coverage or dependency policy.

At the last read-back on 2026-10-03 14:46 UTC, protected-push runs on the merge
SHA were not all terminal: `gate:p2`, the five platform jobs, quality/policy,
Conformance regulatory sources and generated contracts were still in progress.
Regulatory source observation and Security had succeeded; regulatory sources
and generated contracts in Required engineering had succeeded. OSV and npm
audit had failed. These in-progress results are not passes.

## Decision criteria

Preserve truthful phase status and failed evidence; keep law, security, quality,
supply-chain, branch protection and phase-close criteria enforceable; allow the
project owner to authorize narrowly scoped implementation progress; prohibit a
later phase from being used as an implicit repair or waiver for P4.

## Options considered

1. **Wait for P4 evidence-complete before starting any P5 implementation.** This
   retains the unmodified ADR-0058 sequence but leaves all P5 design and
   implementation work stopped until the known P4 findings and outstanding
   current-head observations are closed.
2. **Permit a bounded P5 implementation start while P4 remains unclosed.** This
   permits development on the named P5 branch while preserving P4's failed and
   pending states, with protected merges and phase closure still gated.
3. **Relabel P4 as evidence-complete or weaken/disable the checks.** This would
   contradict observed results and the phase-close matrix, so it is rejected.

## Decision

The project owner, `ddavid07`, explicitly approved option 2 in the Codex session
on 2026-10-03. This decision is a one-time, narrowly scoped amendment to the
P4-to-P5 start prerequisite in ADR-0058 and the roadmap: P5-A through P5-G
implementation work may begin from protected `main`
`1f66da46e21127d1d82018cfdf093f595e1c08ae`, tracked by issue #113 and branch
`work/p5-implementation`.

This authorization is for development on that P5 work branch only. It does not
authorize merging P5 implementation to `main`, bypassing any check for a P5 PR,
closing P4, marking P4 `evidence-complete`, or claiming that any failed or
pending check passed. Protected P5 merges continue to require all effective
required contexts. The original P4-A→P4-G order, populations, thresholds,
oracles and evidence rules in ADR-0058 remain unchanged.

P4 remains phase-unclosed. Before P5 can be declared `evidence-complete`, P4's
failed and pending closure rows must have current exact-subject evidence and a
truthful disposition under the normal protected process or a further explicit
owner decision. P5 work cannot be counted as correction, evidence or closure
for P4. EXC-0001 remains limited to the one-time merge of PR #109 and does not
authorize any later ruleset change.

## Consequences and residual risks

P5 development can proceed while P4 closure work remains visible and owned.
This creates a temporary phase overlap and may require rebasing or revalidation
if the P4 result changes. It does not lower P5 acceptance thresholds or enable
protected integration while required checks fail. The known dependency
advisories remain a security/supply-chain risk and must be tracked to correction
or a separately approved disposition; this ADR accepts no product or release
exposure.

## Verification

At P5 intake, verify the exact `main` and branch SHAs, issue #113, restored
ruleset, current P4 run states and this decision. Each P5 PR must pass its full
exact-head required matrix and closure normally. Before P5 closure, verify P4's
complete phase-close matrix and current protected-main read-back; no stale or
pending result may be represented as passed.

## Migration and reversal

This decision authorizes only the P5 implementation branch named above. It does
not generalize to later phases or other exceptions. If P4 evidence reveals
functional, regulatory or security impact beyond the documented dependency
findings, stop affected P5 work and reassess. Withdrawal before P5 closure
returns phase sequencing to ADR-0058's normal predecessor-closure rule.
