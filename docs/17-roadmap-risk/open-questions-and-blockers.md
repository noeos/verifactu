---
id: ROADMAP-DOC-0011
title: Open questions and blockers
status: approved
authority: normative
owner: project-owner
created: 2026-09-12
last-reviewed: 2026-09-15
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

## P3 authoritative-source blockers

The bounded official observation at `2026-09-15T13:16:10Z` leaves P3 formally
blocked and P4 not ready. Machine authority is
`editions/source-snapshots/rrsif-2026-09-15+src.c0c6eb21f6d2/source-manifest.json`;
this summary cannot override it.

| Blocker | Observed condition | Blocks | Conservative behavior | Unblock evidence |
| --- | --- | --- | --- | --- |
| `AEAT-RECORD-DESIGN-PAYLOAD` | Official page exposes no authoritative artifact | complete field/semantic coverage, approval, P4 | retain blocked candidate; invent no fields | authenticated payload, provenance/licence/dependency closure and successor contracts/oracle |
| `AEAT-VALIDATION-CATALOGUE-PAYLOAD` | Official page exposes no downloadable catalogue or substantive rule content | semantic/error catalogue, approval, P4 | treat XSD enumeration as structural only | authenticated catalogue plus rule/error mapping and independent vectors |
| `AEAT-HASH-SPECIFICATION-PDF` | Published PDF fails normal TLS certificate validation | hash/chain contract, approval, P4 | do not disable TLS or infer algorithm/preimage | normally validated official bytes and independent hash vectors |
| `AEAT-SIGNATURE-SPECIFICATION-PDF` | Published PDF fails normal TLS certificate validation | XAdES profile, approval, P4 | implement no signature profile | normally validated official bytes and independent XAdES/PKI vectors |
| `AEAT-QR-SPECIFICATION-PDF` | Published PDF fails normal TLS certificate validation | QR payload/rendering contract, approval, P4 | implement no QR semantics | normally validated official bytes and independent encode/render/decode vectors |

Owners are `regulatory-owner` for acquisition/contract evidence and
`project-owner` for phase readiness. There is no artificial deadline: each new
observation either supplies authenticated authority or preserves the blocker.
Archived, third-party or certificate-unverified bytes cannot unblock it.

Fresh EUR-Lex GDPR and CRA snapshots also remain blocked after unstable
interstitial responses. Their legal/privacy applicability belongs to later
mapped phases and does not weaken the five mandatory AEAT blockers above.
