---
id: GOV-013
title: Documentation approval and P1 governance evidence
status: approved
authority: evidence
owner: project-owner
created: 2026-09-13
last-reviewed: 2026-09-13
subject-sha: 57a062c7d907287eb25461bea560f42d9dd8b87c
dependencies: [GOV-012, REPO-DOC-0021, ROADMAP-DOC-0004, ASSURANCE-DOC-0010]
decisions: [ADR-0003, ADR-0004, ADR-0005, ADR-0031, ADR-0032, ADR-0033]
historical-inputs: [REV-073, REV-075, REV-076, REV-077, REV-078, REV-079, REV-080, REV-081]
---

# Documentation approval and P1 governance evidence

## Approval claim

The project owner approved the complete current planning corpus. P1 places that
decision under effective repository governance: normative and informative
documents are `approved`, ADRs are `accepted`, and deliberately unresolved
research, finding and template example states retain their own lifecycle value.

This claim means **specified and approved only**. Product source does not exist;
no fiscal behavior, external validation, package, release or future Facturacion
application is represented as implemented. Open questions and external gates
continue to block the claims to which their documents map.

The evidence subject is protected `main` commit
`57a062c7d907287eb25461bea560f42d9dd8b87c`, tree
`47a7cd7fcee6b23e1f551b219b79245690fd1ee0`. The closure PR changes lifecycle
metadata and this evidence record but not the approved product semantics; its
resulting commit is intentionally derived and verified at P2 intake as required
by [`handoff.md`](../17-roadmap-risk/handoff.md).

## Gate results

| Claim | Subject / producer | Result | Retained locator or digest |
| --- | --- | --- | --- |
| Historical archive identity | 117 files | pass | SHA-256 `99641c59c5e5bc32c08dfc337912301b8a7c1f91f08976673eb52396f41c93a1` |
| Bootstrap signature and DCO | `c40f5d6e4e2dc8debe0b365790f9a112d27af663` | pass | SSH fingerprint `SHA256:65VbGskWghAQAXDbJ3/1hrWuYegZNLs/+S96BbNQCzI`; workflow run `34754555914` |
| Action admission | `actions/checkout` `v7.0.1` | pass | official tag resolves to `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| Context discovery before enforcement | bootstrap subject | pass | three `github-actions` check producers on run `34754555914` |
| Positive protected change | PR `#2` | pass | signed+DCO branch commit `6b61669e2c487b2b449ef97cb8fb40785a92f60d`; native squash `57a062c7d907287eb25461bea560f42d9dd8b87c`; main run `34754989598` |
| Native squash attribution | protected main | pass | GitHub `web-flow`, verified GPG signature, exactly one merged main PR and canonical DCO trailer |
| Automatic branch deletion | PR `#2` head | pass | branch read-back returned `404` after merge |
| Direct main push | signed candidate `6b61669e2c487b2b449ef97cb8fb40785a92f60d` | rejected | `GH013`: PR and three checks required |
| Non-fast-forward force push | attempted rollback to `c40f5d6e4e2dc8debe0b365790f9a112d27af663` | rejected | `GH013`: force-push forbidden and PR required |
| Main deletion | `refs/heads/main` | rejected | remote refused deletion of the current default branch |
| Unsigned branch ancestry | PR `#3`, `b2d8158d303a15c9060680d9a8650d2b39db7f76` | rejected and never merged | run `34755046577`: missing SSH signature; PR state `blocked`, then closed |
| Missing-DCO ancestry | PR `#4`, `d79ae2b4a1d47b15f1307651c05ee088da056327` | rejected and never merged | run `34755154669`: author lacks matching final trailer; PR state `blocked`, then closed |
| Local adversarial fixtures | commit/documentation policy self-tests | pass | unsigned, untrusted signer, body-only/duplicate/co-author DCO, empty range, mutable Action, privileged event, duplicate ID, broken link and missing metadata all fail closed |
| Effective GitHub state | 68 exact comparisons at `2026-09-13T11:47:26Z` | pass, 0 mismatches | redacted report SHA-256 `b29e02105091b27d168d128f877a52eebfa67269f4ca960ca4f8b984ccc471a9` |

## Effective policy accepted

- `main` ruleset ID `23163524` is active, targets only
  `refs/heads/main`, has no bypass actor and reports
  `current_user_can_bypass: never`.
- It requires PRs, linear history, signed commits, resolved conversations,
  strict success from the three exact observed contexts and squash as the only
  merge method. Approval count is zero; CODEOWNERS, last-push approval and
  unattributed-change approval are disabled for the real one-person team.
- release-tag ruleset ID `23163527` is active for `refs/tags/v*`, has no bypass
  actor and forbids deletion, update and non-fast-forward changes while
  requiring signatures.
- repository merge commits, rebase, auto-merge, projects, wiki and discussions
  are disabled; squash, DCO web enforcement and automatic branch deletion are
  enabled; `main` is default.
- Actions use the selected allowlist, GitHub-owned Actions only, full-SHA
  enforcement, read-only default token and no PR-approval permission.
- Dependabot alerts/security updates, private vulnerability reporting, secret
  scanning and push protection are enabled. No repository environment, hook,
  deploy key, runner, Actions/Dependabot secret or Actions variable exists.

## Limitations and residual state

The authenticated repository audit could not establish organization-level
Actions permissions, runners, secrets or variables (`403`), nor interpret
organization rulesets/hooks returned as `404` as proof of absence. These states
remain explicitly `inaccessible` or `not-found`, not secure-empty claims.
Repository-level enforcement nevertheless reports no bypass and
`current_user_can_bypass: never`, and every P1 destructive/invalid route tested
above failed in effective operation.

External legal/CRA review, AEAT credentials and portal access, npm ownership and
OIDC, a stable performance runner, independent assessment and custody recovery
drills remain long-lead inputs. They are not P1 exit claims and remain binding at
their roadmap gates. No exception or material P1 finding is accepted.

## Historical disposition

P1 directly prevents the previous failure classes: trailer-aware whole-range
DCO validation (`REV-073`); remotely verified full-SHA Action policy
(`REV-075`); paginated state collection with distinct inaccessible/not-found
states (`REV-076`); truthful zero-approval/no-CODEOWNERS governance (`REV-077`);
no bypass actor (`REV-078`); exact subjects and retained locators (`REV-079`);
direct evidence rather than Scorecard inference (`REV-080`); and explicit
organization visibility limits (`REV-081`). The full historical ledger retains
all other assignments to their implementation phases.

## Post-approval correction

The completion audit after PR `#5` found that the original workflow emitted the
same required context names for branch `push`, `pull_request` and manual events.
GitHub binds a required check to context and App, not to the event that produced
it; therefore a successful run for the same SHA on a different event could make
the PR result ambiguous. This invalidated the P1 context-producer claim until
correction, even though both live negative probes happened to fail on both
events.

Corrective PR `#6` limits the workflow to `pull_request` and `push` on `main`.
The governance validator now rejects wildcard branch pushes, manual events or
any third trigger. Push of correction commit
`01e001eb1b4a3f7b72573e2dc0c101b5f7f68d2c` produced zero runs and zero checks;
opening PR `#6` produced exactly three checks, all from the single
`pull_request` run `34755972167`, and its effective-state audit passed 68/68
comparisons with redacted-report SHA-256
`f18e7123057c9083fc06d79ff69c5566a58fa801061c0eed20d8a33051589450`.
P1 approval is re-established only by the protected native squash of PR `#6`
and its final main-push and effective-state read-backs.

## Audit-pagination correction

A second completion audit found that the interim collector implemented numeric
`page` traversal itself. GitHub's Dependabot alerts endpoint rejected that
parameter, while the report exposed the error only as an informational signal
and still returned `passed`. This reproduced the exact partial-audit/false-green
class P1 assigns from `REV-076` and invalidated P1 audit closure.

Corrective PR `#7` delegates traversal of GitHub `Link` pagination to
`gh api --paginate`, safely decodes and merges every returned JSON document, and
fails on malformed pages or cross-page scalar drift. Maintained offline fixtures
cover multi-page arrays, collection objects, malformed streams and inconsistent
pages. Dependabot and secret-scanning alert surfaces are now mandatory-readable
P1 checks; code scanning is explicitly required to remain `not-found` until the
versioned CodeQL implementation in P2.

The same review tested additional GitHub security capabilities. A repository
`PATCH` requesting validity checks and non-provider secret patterns returned
success but immediate read-back kept both `disabled`; CodeQL default setup
reported `not-configured`. These are retained capability observations, not
successful-enable claims. The enabled P1 controls remain Dependabot alerts and
security updates, private vulnerability reporting, secret scanning and push
protection. P2 must re-evaluate entitlement and add versioned CodeQL without
silently changing the recorded historical result.
