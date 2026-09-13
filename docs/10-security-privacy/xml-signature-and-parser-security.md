---
id: SEC-DOC-0006
title: XML, fingerprint and signature security
status: draft
authority: normative
owner: security-owner
created: 2026-09-12
last-reviewed: 2026-09-12
review-by: 2026-10-12
dependencies: [SEC-DOC-0005, DOM-DOC-0008, REG-DOC-0012]
historical-inputs: [REV-009, REV-020, REV-028, REV-038]
---

# XML, fingerprint and signature security

## Parsing profile

XML input is accepted only for a named schema edition and bounded byte length.
DTD, external/internal entity expansion, XInclude, network/file resolution and
implementation-specific extensions are disabled. Depth, attributes, namespace
bindings, text length, element count and parse time have enforced ceilings.
Malformed encoding, duplicate security-relevant identifiers and ambiguous
namespace use fail before semantic processing.

Schema validation is necessary but insufficient: the parsed typed model also
passes catalogue, cross-field, arithmetic, context and state rules. Security
logic never selects elements with an unqualified descendant search.

## Signature profile

The active edition is a closed allowlist for canonicalization, digest, signature
algorithm, transforms, reference URI, signed element and certificate material.
Verification proves that the application-consumed element is exactly the signed
element, with unique ID resolution and no unsigned shadow. Unknown/weak
algorithms, external references, extra transforms and duplicate IDs fail closed.
Certificate validity, intended usage, chain/trust and relevant validation time
are evaluated by the configured trust policy; cryptographic validity alone is
not authority acceptance.

## Deterministic generation

Semantic field order, lexical decimal/date form, encoding, namespaces and
canonicalization are edition-owned. Signing consumes stored deterministic bytes
or a precisely specified canonical node set. Pretty printing or parsing and
re-emitting cannot alter an already identified artifact.

## Required adversarial corpus

Official positive/negative examples are supplemented with entity bombs,
quadratic/deep structures, malformed encodings, namespace rebinding, duplicate
IDs, signature wrapping, wrong reference, external URI, extra transform, weak/
unknown algorithm, modified signed/unsigned nodes, certificate-time and large
signature inputs. Tests assert resource use, no network/file access, diagnostics
and unchanged durable state.
