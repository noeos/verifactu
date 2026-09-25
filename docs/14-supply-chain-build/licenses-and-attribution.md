---
id: BUILD-DOC-0012
title: Licences and attribution
status: approved
authority: normative
owner: legal-owner
created: 2026-09-12
last-reviewed: 2026-09-25
decisions: [ADR-0034, ADR-0036, ADR-0054, ADR-0057]
historical-inputs: [REV-069, REV-070]
---

# Licences and attribution

Project-owned material uses Apache License 2.0 under
[`ADR-0054`](../00-governance/decisions/ADR-0054-apache-2.0-project-license.md).
This does not relicense official sources, third-party dependencies, vendored
content or fixtures; each retains its own verified terms and redistribution
boundary.

The licence graph covers owned code, every transitive dependency, bundled/native
code, GitHub Action, external tool, provider runtime, vendored/generated source,
official data and fixture. It records detected/declared SPDX expression, evidence
file/digest, copyright/notice, distribution scope and compatibility decision.

Unknown, conflicting, deprecated/custom or `NOASSERTION` licences require legal
disposition before distribution. Development-only tools remain recorded even if
not shipped; package notices include exactly the obligations of distributed
contents. Official/public availability does not imply redistribution permission.

The selected local EU DSS provider candidate is LGPL-2.1 software. Before any
P4-D implementation or distribution, the admission dossier must reconcile the
exact DSS release and complete Maven transitive/shaded graph, per-component
licence and copyright, retained licence/NOTICE texts, modifications, source
availability obligations, packaging/linking model, SBOM and the exact packed
consumer contents. Maven Shade overlap and resource collisions are reviewed,
not dismissed as build noise. This repository's engineering inventory is not
external legal advice or a legal opinion; competent legal review remains an
explicit distribution prerequisite.

Generation preserves verbatim required notices without exceeding source rights,
deduplicates only identical text and links component identity. Negative fixtures
cover missing transitive, dual licence selection, absent notice, bundled code and
package/SBOM disagreement. Legal review is mandatory on licence/source change.
