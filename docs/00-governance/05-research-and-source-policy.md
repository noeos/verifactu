---
id: GOV-005
title: Research and source policy
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
decisions: [ADR-0006]
historical-inputs: [REV-004, REV-006, REV-062]
---

# Research and source policy

## Purpose

Every significant choice must distinguish binding facts, professional guidance,
inference and preference. Research is retained so a future maintainer can
reproduce why a decision was reasonable at the time.

## Source preference

For technical questions prefer, in order: the governing specification,
official product documentation, official source/tests, author or maintainer
material, standards bodies, peer-reviewed research and then professional
secondary experience. For legal questions use official EU/Spanish publication
and competent authorities before commentary.

Community reports may reveal failure modes but cannot alone establish legal
meaning, platform guarantees or cryptographic correctness.

## Required research record

A significant decision records:

- the precise question and decision scope;
- constraints and non-goals;
- source title, authority, URI, version and consultation date;
- stable identifier or digest when bytes matter;
- confirmed facts separately from inference;
- feasible options, including keeping the current design;
- advantages, disadvantages and known failure modes;
- security, privacy, performance, compatibility and operational effects;
- adoption and reversal cost;
- uncertainties and evidence that could refute the conclusion;
- recommendation and required verification.

One authoritative primary source can settle a direct normative fact. A
significant design choice also requires independent comparison, empirical
evidence or an explicit explanation of why neither is available. Source count
is not a substitute for authority or relevance.

## Volatile sources and snapshots

Live pages are suitable for discovery but insufficient for reproducible
regulatory editions, generated contracts or release evidence. Material bytes
must be acquired by an approved process, bounded before parsing, stored with
provenance, version, retrieval time, length and SHA-256/SHA-512, and checked for
license and redistribution constraints.

No source is silently refreshed. Drift opens impact analysis and cannot update
an approved edition automatically.

## External frameworks

NIST SSDF, OWASP SAMM, OpenSSF guidance, SLSA, GitHub documentation, C4,
Diataxis and ADR practices are informative engineering inputs unless explicitly
adopted by an ADR. Compliance with a named framework is claimed only against a
versioned mapping and evidence, not because its terminology appears in files.

## Governance foundation sources

The following primary sources were consulted on 2026-09-12. They justify
specific mechanisms but do not imply full framework conformance:

| ID | Source and version | Governance use |
| --- | --- | --- |
| `SRC-0001` | [NIST SP 800-218, SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Integrate secure development, protect software, produce well-secured releases and respond to vulnerabilities throughout the lifecycle. |
| `SRC-0002` | [OWASP SAMM model 2](https://owaspsamm.org/model/) | Check that governance, design, implementation, verification and operations are all planned rather than treating security as one late scan. |
| `SRC-0003` | [SLSA specification 1.2](https://slsa.dev/spec/v1.2/) | Design source/build provenance and verification without claiming an unmeasured SLSA level. |
| `SRC-0004` | [GitHub ruleset rule semantics](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) | Configure required PRs, verified signatures, linear history, strict checks, deletion/force-push restrictions and explicit bypass policy. |
| `SRC-0005` | [GitHub Actions threat protection](https://docs.github.com/en/code-security/tutorials/secure-your-organization/protect-against-threats) | Pin third-party Actions to reviewed full commit SHAs, restrict allowed Actions and grant minimum token permissions. |
| `SRC-0006` | [Developer Certificate of Origin 1.1](https://developercertificate.org/) | Define what the `Signed-off-by` assertion certifies and its permanent public-record implications. |

GitHub documents that a platform required check may be considered satisfied by
`successful`, `skipped` or `neutral` conclusions. Our policy is deliberately
stricter: the aggregate gate accepts only explicit success for every applicable
constituent. Likewise, GitHub supplies signature enforcement, while DCO trailer
semantics require a separate repository gate.
