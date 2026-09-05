# Contributing

Noeos accepts changes that preserve the normative corpus in `docs/`, identify official sources and keep every required gate green. Security reports use `SECURITY.md`, never a public issue.

## Before changing the repository

1. Open an issue for a non-trivial change.
2. Link requirements and exact sources.
3. Declare regulatory, security, compatibility, privacy and performance impact.
4. Add or update a decision before changing an approved design.
5. Keep one reviewable responsibility per PR.

## Commits

Every commit must be cryptographically signed and certify the [Developer Certificate of Origin 1.1](https://developercertificate.org/):

```text
Signed-off-by: Your Name <your-email@example.com>
```

Use `git commit --signoff`. The author certifies the right to contribute under Apache-2.0, identifies third-party content and has not included secrets or real fiscal data.

## Review

PRs are mandatory. Required checks, conversations, generated contracts, traceability and evidence must complete. Do not weaken a gate, accept unexplained flakiness, regenerate expected bytes without reviewing the diff or convert an indeterminate result into success.

Third-party code, standards, examples or assets require source, version, license/reuse terms, modifications and approval. Unknown licensing blocks inclusion.

The pinned Node/npm toolchain and `npm run ci` must pass before every PR. Regulatory source changes require provenance, hashes, contract generation, independent review and a documented decision. Never include taxpayer data, credentials or private keys in code, tests, fixtures, logs or issue reports.
