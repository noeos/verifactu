# VeriFactu

VeriFactu is a governed product repository executing Phase P2 of its approved
implementation roadmap. It now contains an admitted engineering toolchain, the
canonical task graph and exactly three private package shells. Those shells expose
no fiscal behavior, public bindings or command-line executable; there is still no
publishable package, regulatory edition or release.

The intended final product is a complete TypeScript library, CLI and adapter kit
for the Spanish VERI*FACTU and NO VERI*FACTU domain. Its approved scope,
architecture, legal constraints, security model, verification strategy and
delivery controls are specifications, not claims about implemented behavior.

## Ecosystem boundaries

- VeriFactu will consume an independently admitted release of Noeos
  Verification Engine through its public verification contracts; it will not
  duplicate that engine or assume an unpublished local checkout.
- Facturación is a future client application. It has not been built and is not
  integrated here. This repository plans only a synthetic host contract so that
  the future application can integrate without coupling this library to an
  imagined implementation.
- AEAT connectivity, credentials, certificates, legal assessment, independent
  assurance and npm publication remain gated later-phase work. None is implied
  by the public repository.

## Authoritative navigation

- [Documentation map](docs/README.md)
- [Documentation structure and authority](docs/STRUCTURE.md)
- [Implementation roadmap](docs/17-roadmap-risk/implementation-roadmap.md)
- [Phase handoff](docs/17-roadmap-risk/handoff.md)
- [Governance charter](docs/00-governance/01-project-governance-charter.md)
- [Current approval and P1 evidence](docs/00-governance/13-documentation-approval-report.md)

`docs/previous-docs/` is immutable historical input. It is useful for preventing
repeat failures but has no current normative authority.

## Current development state

P1 governance is effective on protected `main`. P2 adds executable repository,
toolchain, package, formatting, lint, type and falsification controls before any
fiscal capability is introduced. The private `0.0.0-development` shells are
structural inputs, not claims of an implemented library, CLI or adapter kit.
Follow P2 and later phases in dependency order; fiscal behavior begins only at
the expressly gated phase in the roadmap.

All changes use an issue-linked short-lived branch, SSH-signed and DCO-signed-off
commits, the complete required-check set, and native squash merge. Direct pushes,
force pushes, branch deletion and bypass of `main` are prohibited. This is a
single-maintainer repository: it deliberately requires zero approving reviews
and has no `CODEOWNERS` fiction.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the exact change path and
[SECURITY.md](SECURITY.md) for private vulnerability reporting. No licence to
copy, modify or distribute repository contents has yet been granted; see
[LICENSE](LICENSE) and [NOTICE](NOTICE).
