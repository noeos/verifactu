---
id: REF-DOC-0001
title: Glossary
status: approved
authority: informative
owner: documentation-owner
created: 2026-09-12
last-reviewed: 2026-09-13
decisions: [ADR-0053]
---

# Glossary

| Term | Lookup meaning; canonical authority |
|---|---|
| SIF | Billing computer system in the applicable RRSIF sense; `REG-INDEX`. |
| VERI*FACTU / NO VERI*FACTU | Explicit dated operating modalities, never product nicknames; `DOM-INDEX`. |
| Invoice / billing record | Distinct commercial document and immutable RRSIF record; `DOM-INDEX`. |
| Edition | Immutable bundle of official sources/contracts/policy; `REG-DOC-0007`. |
| Evidence / claim | Observation versus scoped conclusion; `QA-DOC-0002`. |
| Artifact | Typed exact bytes with custody/digest; `ADR-0025`. |
| Indeterminate | Available evidence cannot establish success/failure; never success. |
| Release | Exact three-package/public/evidence state, not merely a tag; `RELEASE-DOC-0002`. |
| Host / provider / adapter | Generic host owner, capability implementation and port implementation; future Facturacion is represented now by a synthetic host under `INTEGRATION-INDEX`. |

The generated final glossary imports all canonical domain/contract terms, records
homonyms/language/owner and rejects duplicate conflicting definitions.
