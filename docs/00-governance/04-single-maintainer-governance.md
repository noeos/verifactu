---
id: GOV-004
title: Single-maintainer governance
status: approved
authority: normative
owner: project-owner
created: 2026-09-11
last-reviewed: 2026-09-12
decisions: [ADR-0004]
historical-inputs: [REV-073, REV-075, REV-076, REV-077, REV-078, REV-079, REV-080, REV-081]
---

# Single-maintainer governance

## Human model

The project currently has one human owner and maintainer. Product, regulatory,
technical, security, release, recovery and evidence-verification roles remain
distinct responsibilities even when the same person performs them. This
distinction drives required viewpoints and records; it does not simulate
independent people.

No automated agent, bot, language model or self-review is represented as
independent human approval. External legal, cryptographic or security review is
recorded only when it actually occurs and need not grant repository access.

## Change path to `main`

After the one-time empty-repository bootstrap described below, every change:

1. starts from current protected `main` on a purpose-specific branch;
2. has an issue, approved work item or decision identifier;
3. uses SSH-signed commits;
4. includes valid DCO `Signed-off-by` trailers;
5. is pushed without force-updating shared history;
6. enters through a pull request;
7. passes the complete required deterministic toolchain and CI for the final
   head SHA, with no unauthorized skip, neutral result or stale evidence;
8. resolves all review conversations and detected findings;
9. is squash-merged to a signed commit on `main`;
10. deletes the source branch automatically;
11. verifies the resulting `main` SHA and records any required evidence.

Any change after a successful run invalidates that run for merge purposes.

## Commit signature and DCO

Every human-authored commit and release tag MUST carry a verifiable SSH
signature rooted in an allowed signer policy. Every commit MUST also carry a
final canonical trailer:

```text
Signed-off-by: Daniel David <ddcandales@gmail.com>
```

The DCO identity must correspond to the actual author or contributor. Each
co-author requires their own sign-off unless an approved bot policy expressly
defines a truthful alternative. Text resembling a sign-off in the message body
does not count.

Signature verification and DCO verification are separate gates. The DCO
checker must parse trailers, validate the exact PR commit range, fail closed
when PR SHAs are missing, and test malformed trailers, missing co-author
sign-offs and empty ranges.

The normal local authoring command is `git commit -S -s`; `-S` requests the
configured SSH signature and `-s` adds the contributor's DCO trailer. Automation
must not infer one from the other. Before push, the local gate verifies the
signature cryptographically against the repository's allowed-signers policy and
parses the commit object rather than terminal output. The pull-request gate
also requires GitHub to report every introduced signature as verified.

The squash commit is a new commit and therefore must itself be verified and
contain the maintainer's canonical DCO trailer in the final merge message. A
post-merge job checks the resulting `main` object; valid PR commits do not excuse
an unsigned or unsigned-off squash commit.

## GitHub policy

`main` requires a PR but zero approving reviews. There is no `CODEOWNERS`, no
last-push approval and no additional approval for unattributed agent changes.
Compensating controls are:

- strict required checks from their expected producer;
- signed commits and DCO;
- linear history and squash only;
- resolved conversations;
- no deletion, force-push or permanent bypass on `main`;
- minimum workflow permissions and untrusted-PR isolation;
- full-SHA Action pinning and a reviewed allowlist;
- effective-state audit after administrative changes;
- separately built and verified release evidence.

## Release separation

The same maintainer may initiate and complete a release, but construction,
publication and post-publication verification remain distinct jobs and trust
steps. Release protection relies on signed immutable tags, exact ancestry,
protected environments without impossible reviewer requirements, OIDC,
provenance, reproducibility and independent verification of published bytes.
No false human separation is configured.

## Empty-repository bootstrap

A PR cannot target a branch that does not exist and required checks cannot be
validated before their workflows exist. The initial signed bootstrap commit may
therefore create `main` directly. It must contain only the approved minimum
documentation/toolchain needed to establish the protected process, record the
exception, run the initial workflows, configure protections, read back the
effective state and prohibit further direct changes. This exception expires as
soon as protection is verified and can never be reused for product code.

## Residual risk

Bus factor one remains an explicit risk. Documentation, recovery material,
least privilege and deterministic automation reduce impact but do not create a
second capable maintainer. Release dossiers state the absence of independent
human code review.
