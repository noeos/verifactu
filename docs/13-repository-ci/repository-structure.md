---
id: REPO-DOC-0001
title: Complete repository structure
status: approved
authority: normative
owner: repository-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ARCH-DOC-0004]
decisions: [ADR-0015, ADR-0030]
historical-inputs: [REV-065, REV-066, REV-072, REV-084]
---

# Complete repository structure

The implementation MUST use this semantic top-level tree:

```text
/
  .github/{ISSUE_TEMPLATE,PULL_REQUEST_TEMPLATE.md,dependabot.yml,workflows/}
  docs/                         # governed normative and historical knowledge
  packages/
    verifactu/{src,test,package.json,tsconfig.json}
    cli/{src,test,package.json,tsconfig.json}
    adapter-kit/{src,test,package.json,tsconfig.json}
  internal/
    source-import/ contract-generation/ independent-oracles/
    xml-provider/ xades-provider/ protocol-harness/ test-support/
  editions/<edition-id>/{manifest,schemas,wsdl,catalogues,vectors,licenses}/
  schemas/                      # generated public interchange schemas
  fixtures/{official,synthetic,adversarial,compatibility}/
  tests/{contract,integration,e2e,security,performance,packaging,policy}/
  benchmarks/{workloads,profiles,baselines}/
  config/                       # canonical tool/policy configuration
  scripts/                      # thin task launchers only
  tooling/                      # owned checker/generator source and tests
  evidence/schemas/             # report schemas, never transient run output
  package.json package-lock.json tsconfig.json
  .node-version .npmrc .gitignore .gitattributes .editorconfig
  LICENSE NOTICE SECURITY.md CONTRIBUTING.md README.md
```

`packages/verifactu/src` is divided into `contracts`, `domain`, `application`,
`ports`, `editions`, `verification` and reviewed `index.ts`; CLI and adapter-kit
have their own public roots. Internal providers/oracles are never published.

Transient `dist`, coverage, mutation/fuzz corpora under execution, downloads,
credentials, logs and run evidence live only in validated task-specific temp or
artifact locations and are ignored. No `misc`, generic `utils/helpers/common`,
root source, second lockfile or undeclared workspace is allowed. A tree manifest
and negative fixture enforce every placement before source creation.
