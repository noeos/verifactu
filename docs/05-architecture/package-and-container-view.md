---
id: ARCH-DOC-0004
title: Package container and future source tree
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
decisions: [ADR-0015]
historical-inputs: [REV-050, REV-072, REV-084]
---

# Package container and future source tree

## Repository tree

```text
packages/
  verifactu/src/
    domain/              # fiscal values, aggregates, invariants, states
    application/         # use cases and effect-free orchestration decisions
    ports/               # host/provider contracts only
    contracts/           # public codecs, results, events and schema facade
    editions/            # immutable installed-edition access facade
    verification/        # official and Noeos claim aggregation
    index.ts              # reviewed public root only
  adapter-kit/src/       # adapter contract tests, fixtures and evidence report
  cli/src/               # grammar, streams, command execution and exit mapping
internal/
  source-import/         # quarantined official acquisition and manifests
  contract-generation/   # XSD/WSDL/catalog generation
  xml-provider/          # isolated XML/XSD bridge
  xades-provider/        # isolated DSS/provider bridge
  protocol-harness/      # strict local AEAT peer
  independent-oracles/   # never imported by production packages
  test-support/          # non-public deterministic builders/fault controls
editions/<edition-id>/   # manifests, schemas, catalogues, vectors, licences
schemas/                 # public JSON schemas generated from canonical contracts
fixtures/                # non-secret positive/negative public fixtures
tests/{unit,contract,integration,e2e,security,performance,packaging}/
scripts/                 # thin pinned task entry points
```

Tests mirror behavior, not source folder internals. Generated directories are
declared and never edited manually. Providers may become separately deployed
processes but remain private implementation components. `dist`, coverage,
temporary credentials and live portal captures are never source-controlled.

Public packages are the library, adapter kit and CLI. Adding a public subpath,
package or root export requires compatibility review and a clean packed-artifact
test; filesystem paths inside `editions/` are not public contracts.
