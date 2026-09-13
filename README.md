# VeriFactu

VeriFactu is currently a **documentation-only, governed repository**. Phase P1
establishes the planning baseline and the effective Git/GitHub controls required
before product implementation starts. It does not yet contain product source,
publishable packages, a fiscal runtime, a CLI, regulatory editions or a release.

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

Only governance policy, documentation validation, commit signature/DCO checks
and read-only GitHub effective-state auditing are executable in P1. Start no
product work until the P1 exit evidence on protected `main` is complete, then
follow P2 and later phases in dependency order.

All changes use an issue-linked short-lived branch, SSH-signed and DCO-signed-off
commits, the complete required-check set, and native squash merge. Direct pushes,
force pushes, branch deletion and bypass of `main` are prohibited. This is a
single-maintainer repository: it deliberately requires zero approving reviews
and has no `CODEOWNERS` fiction.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the exact change path and
[SECURITY.md](SECURITY.md) for private vulnerability reporting. No licence to
copy, modify or distribute repository contents has yet been granted; see
[LICENSE](LICENSE) and [NOTICE](NOTICE).
