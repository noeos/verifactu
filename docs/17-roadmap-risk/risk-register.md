---
id: ROADMAP-DOC-0009
title: Product risk register
status: approved
authority: normative
owner: risk-owner
created: 2026-09-12
last-reviewed: 2026-09-25
decisions: [ADR-0049, ADR-0051, ADR-0055, ADR-0057, ADR-0058]
historical-inputs: [REV-001, REV-084]
---

# Product risk register

Mandatory risks cover regulatory/AEAT drift/ambiguity, applicability/declaration/
CRA, crypto/XML, atomicity/concurrency/data loss, indeterminate delivery, key/
account/certificate, supply-chain/runner/GitHub/npm, partial publication, Engine/
provider/host compatibility, resource/backlog, privacy support data, external
validation, overstated claims, single maintainer, upstream EOL and evidence loss.

Each has `RISK-*`, method fields, mapped controls/tests/runbook and release effect.
Views sort current inherent/residual severity and overdue treatment. Closing needs
measured control evidence; accepting risk uses `EXC-*` authority and cannot waive
law or falsify a guarantee.

## P3-B current residual risks — 2026-09-21

| Risk                                                                                                                   | Owner            | Due date/gate                                          | Current control and evidence                                                                                       | P4-start effect                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `RISK-P3B-001` official-source drift after observation                                                                 | regulatory-owner | Every source observation and before any edition change | immutable dual-digest snapshot, byte-identical macOS/Windows payload witnesses, deterministic regeneration         | Blocks P4 if the admitted source closure changes without a successor snapshot |
| `RISK-P3B-002` first P4 commit bypasses quantitative controls                                                          | quality-owner    | Before P4-A implementation begins                       | ADR-0058, exact 44-module/26-test plan, and a seeded fail-closed manifest validator + required readiness context | Blocks P4-A and all downstream waves until exact-head green                    |
| `RISK-P3B-003` source/generator/oracle common cause                                                                    | assurance-owner  | Every contract-generator change                        | independent Python parser/hash oracle, six seeded defects and exact population recount                             | Blocks changed contracts until the independent path passes                    |
| `RISK-P3B-004` protected evidence subject becomes stale                                                                | repository-owner | Every PR head and protected-main push                  | exact commit/tree reports, 17 required contexts and closure check                                                  | Blocks phase status; previous-subject reports cannot be reused                |
| `RISK-P3B-005` later legal, credential, operational or external-assurance prerequisites are mistaken for P3-B evidence | project-owner    | P7 entry and again before any P8 release authorization | explicit `creationAllowed=false`, no P4 runtime and scoped not-applicable proof                                    | Does not block starting P4 code; blocks the affected later claim/release      |

There is no accepted exception and no unowned P3-B blocker. These rows reopen
on their stated trigger; a downstream prerequisite is not silently presented as
completed merely because it does not apply to pre-P4 foundation code.
