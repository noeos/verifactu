---
id: REG-DOC-0010
title: Responsible declaration
status: approved
authority: normative
owner: regulatory-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
sources: [SRC-0011, SRC-0014, SRC-0026]
requirements: [REG-0050, REG-0051, REG-0052]
historical-inputs: [REV-063, REV-074, REV-082]
---

# Responsible declaration

## Nature and scope

The producer certifies compliance through its own responsible declaration for
the exact SIF product/version. This is neither prior AEAT approval nor a generic
organization certificate. The declaration is a high-impact release artifact
whose truth depends on the complete evidence dossier.

## Canonical content

The declaration generator must represent, in the official order and form then
applicable, at least product name/code/version and differentiating components;
whether it is exclusively VERI*FACTU; supported modes; producer identity,
tax/foreign identity and address; signature types for non-verifiable operation;
date/place; explicit compliance statement against Law 58/2003, RRSIF, Order
HAC/1177/2024 and enabled AEAT specifications; and authorized signature/identity.

The actual edition derives the complete field list directly from the order and
official examples. This prose is not a substitute for that generated contract.

## Release binding

The declaration binds:

- product version and immutable package/release digests;
- regulatory edition and source manifest;
- supported runtime/platform and integration surfaces;
- Verification Engine, adapter and provider compatibility;
- completed requirement/threat/performance matrices;
- exact CI/release evidence and known residual risks;
- producer identity and signing authority.

Any material divergence creates a new version/declaration or revokes the claim.

## Generation and publication

Generation is deterministic from reviewed metadata; required human/legal
approval and signature occur only after independently verifying published bytes.
The release distributes the declaration in a directly accessible form alongside
verification instructions. Producer and commercializer retain every historical
version.

## Negative controls

Release fails for missing/placeholder field, wrong ordering where normative,
floating edition/dependency, package digest mismatch, unsupported “exclusive
VERI*FACTU” claim, stale date/source, unsigned declaration, open contradictory
finding or evidence produced before final code.
