# Contributing to VeriFactu

## Present contribution boundary

The repository is in its governed implementation programme and has one
maintainer. Until an explicit project-licence decision and legal review are
approved, unsolicited external code, documentation and other copyrightable
contributions are not accepted. Do not interpret public visibility, a pull
request interface or DCO sign-off as permission to copy, modify or distribute
the contents.

Synthetic, non-sensitive defect reports and suggestions may be opened as GitHub
issues. Do not post fiscal records, taxpayer or customer data, credentials,
certificates, private keys, production payloads, exploit details or other
sensitive material. Security reports follow [SECURITY.md](SECURITY.md), never a
public issue.

## Maintainer change contract

Every repository change must:

1. start from current protected `main` with a clean worktree and a coherent
   issue/work item;
2. use a short-lived branch named
   `<type>/<work-id>-<short-scope>`, where `type` is `feat`, `fix`, `docs`,
   `refactor`, `test`, `build`, `ci`, `security` or `chore`;
3. contain reviewable commits created with `git commit -S -s`, using the admitted
   SSH signing key and an exact matching final
   `Signed-off-by: Name <email>` trailer;
4. contain no secret, personal/fiscal production data, generated noise,
   unrelated change or unrecorded policy exception;
5. update the governing requirements, decisions, traceability and evidence when
   behavior or claims change;
6. pass the canonical local tasks and every required GitHub check for the exact
   pull-request head;
7. merge only through GitHub native squash, preserving work/PR identity and DCO
   attribution; and
8. verify the signed squash on `main`, its post-merge checks and automatic source
   branch deletion.

The P1 required checks are exactly:

- `Required · governance signatures and DCO`;
- `Required · documentation and traceability`; and
- `Required · required-check closure`.

Later phases replace this bootstrap set only through the documented protected
rollout procedure. A green subset, a skipped job or evidence for another commit
does not authorize merge.

## Pull-request record

Use the repository pull-request template. State the change and explicit
omissions; linked work and claim IDs; legal, regulatory, security, privacy,
performance and compatibility impact; dependencies/generated output; exact
commands and retained evidence; rollback point; and any residual limitation.
Resolve every conversation with code/evidence or a recorded disposition.

The effective policy intentionally has zero required approving reviews, no
`CODEOWNERS`, no last-push approval, no fake reviewer and no bypass actor. The
sole maintainer performs the review and records it through the protected checks,
traceability and handoff. External-fork workflows require explicit maintainer
approval before they can execute, but that security control is not a code-review
approval.

The normative details are in the
[local workflow](docs/13-repository-ci/local-development-workflow.md),
[commit/branch/PR policy](docs/13-repository-ci/git-commits-branches-and-pull-requests.md),
[signature and DCO policy](docs/13-repository-ci/ssh-signatures-and-dco.md) and
[repository rulesets](docs/13-repository-ci/branch-and-tag-rulesets.md).
