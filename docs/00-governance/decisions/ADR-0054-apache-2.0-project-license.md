---
id: ADR-0054
title: Apache License 2.0 as the project license
status: accepted
authority: decision
owner: project-owner
created: 2026-09-19
last-reviewed: 2026-09-19
supersedes: []
sources: []
requirements: []
risks: []
---

# ADR-0054: Apache License 2.0 as the project license

## Question and context

The repository needs one explicit license decision before implementation and
distribution. The repository root already contains the Apache License 2.0 text,
but the governing documentation must state which license applies to project-
owned material and where third-party, official and generated material remains
subject to separate terms.

## Decision criteria

The license must support broad reuse and integration, provide an explicit patent
grant, preserve attribution and notice obligations, work with the planned npm
packages and adapter ecosystem, and remain compatible with strict dependency,
SBOM, provenance and redistribution auditing. It must not imply that official
regulatory material or third-party dependencies can be relicensed by the
project.

## Options considered

- **Apache License 2.0:** permissive reuse, explicit patent grant and clear
  notice requirements; compatible with the planned public package surfaces.
- **MIT:** permissive and simple, but without the same explicit patent grant and
  with less complete notice language for this project's assurance model.
- **GPL/AGPL:** strong reciprocity, but imposes distribution and integration
  obligations that do not match the intended reusable library, CLI and adapter
  ecosystem.
- **No license or a custom license:** does not provide a reliable public reuse
  grant and creates unnecessary interpretation and compatibility risk.

## Decision

Project-owned source code, documentation, configuration, tests and original
artifacts in `noeos/verifactu` are licensed under the Apache License 2.0 unless
a file or a more specific repository notice states otherwise. The canonical
license text is the root `LICENSE` file and its SPDX identifier is `Apache-2.0`.

This decision does not relicense third-party dependencies, vendored material,
official AEAT/BOE/EU text, standards, schemas, examples or external fixtures.
Each such item retains its original terms and must have provenance, license and
redistribution evidence before admission or distribution. Required attribution,
copyright, NOTICE and source-license obligations are preserved verbatim where
applicable.

All future packages and published artifacts MUST carry the Apache-2.0 identity
for project-owned material, include the required `LICENSE`/`NOTICE` content, and
declare the complete third-party license graph in the SBOM and release dossier.
Contributors retain copyright in their contributions and contribute under the
Apache-2.0 terms; DCO attribution and repository contribution controls remain
mandatory. Apache-2.0 does not grant project trademarks or authorize legal,
regulatory or compliance claims.

## Consequences and residual risks

The decision gives users and integrators a clear permissive reuse grant and
patent terms while preserving a strict audit boundary for dependencies and
official material. It requires accurate attribution, NOTICE generation,
SPDX/package metadata, SBOM reconciliation and legal review whenever a source,
dependency or redistribution scope changes. A license that is unknown,
conflicting, incompatible or not supported by the actual use remains a release
blocker; this ADR is not a substitute for item-level legal analysis.

## Verification

Future implementation and release gates must verify all of the following:

1. the root `LICENSE` is the canonical Apache License 2.0 text and all project-
   owned package metadata declares `Apache-2.0`;
2. SPDX headers and package metadata, where required by the repository policy,
   agree with the project license and do not overwrite upstream identity;
3. `LICENSE`, `NOTICE` and all required third-party notices are present in each
   allowed package and tarball;
4. the resolved dependency, Action, tool, provider, vendored, generated and
   fixture inventory has a verified license expression and redistribution
   decision;
5. CycloneDX, SPDX, package contents and release dossier license views reconcile
   exactly; and
6. negative tests fail closed for missing notices, unknown licenses, conflicting
   metadata, unauthorized relicensing and package/SBOM disagreement.

Until those executable checks exist, this ADR records the accepted design
decision only and does not claim distribution or implementation compliance.

## Migration and reversal

The existing root `LICENSE` already establishes the selected project license.
Implementation must carry the decision into package manifests, source headers,
NOTICE generation, SBOMs, tarball allowlists and release dossiers before any
publication. Reconsideration requires a new accepted ADR, an impact review of
all consumers and dependencies, an explicit migration/compatibility plan and a
new release policy; it must never silently change the license of existing
published artifacts.
