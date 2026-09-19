---
id: CRYPTO-DOC-0004
title: XML model and serializer
status: approved
authority: normative
owner: cryptography-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0019]
historical-inputs: [REV-011]
---

# XML model and serializer

The internal XML model distinguishes document, element expanded name, prefix
binding, ordered attributes by expanded name, text and permitted comments. Raw
markup strings are impossible. Duplicate attributes, unbound/reserved prefixes,
namespace conflicts, invalid XML characters and illegal name/QName forms fail.

Serializer rules fix namespace placement/prefix policy, attribute quoting,
escaping of `& < >` and quotes where required, carriage-return/tab/newline
handling, empty element form and UTF-8 encoding. Fiscal field order comes from
the edition; attribute order is deterministic but never mistaken for semantic
XML equivalence.

Parsing for verification uses the hardened backend with DTD/entity/network
disabled. Round-trip tests preserve expanded names, attribute values and text
for the supported subset. Adversarial fixtures cover entity expansion, duplicate
IDs, namespace rebinding, Unicode boundaries, invalid controls, tabs/newlines,
truncation, deep/wide trees and quadratic payloads.
