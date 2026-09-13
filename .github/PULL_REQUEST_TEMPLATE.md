# Pull request evidence record

## Work and scope

- Issue/work ID:
- Governing requirements, ADRs, controls and risks:
- Exact change:
- Explicit omissions and why they remain out of scope:

## Impact analysis

- Legal/regulatory:
- Security/privacy and threat-model delta:
- Performance/reliability/recovery:
- Public API, compatibility and migration:
- Dependencies, executable inputs, generated/vendor content and licences:
- Documentation, traceability and historical-finding disposition:

Use `not applicable` only with a concrete reason. An empty field is not a
reviewed impact disposition.

## Verification and evidence

- Exact local commands and results:
- Negative/adversarial fixtures exercised:
- Exact commit/tree/package/edition subjects:
- CI runs, reports and retained evidence locators/digests:
- Independent/external evidence and limitations:

## Rollback and residual state

- Last verified recovery point and procedure:
- Invalidated evidence or downstream work:
- Residual risks, exceptions, blockers and long-lead items:
- Handoff/next-phase update:

## Author checklist

- [ ] The branch has one coherent issue-linked objective and follows the naming
      policy.
- [ ] Every commit in the PR range has an admitted SSH signature and a matching
      canonical DCO `Signed-off-by` trailer.
- [ ] I reviewed the complete diff and excluded secrets, credentials, private
      keys and real personal/fiscal/production data.
- [ ] Governing documents, decisions, traceability, tests and evidence were
      updated together where their claims changed.
- [ ] Exact canonical local tasks pass without ignored, skipped, retried or
      stale results.
- [ ] Every required GitHub context must pass for this exact final head before
      native squash merge.
- [ ] The squash message will preserve issue/PR identity and DCO attribution;
      the signed main commit, post-merge checks and automatic branch deletion
      will be verified.

Security vulnerabilities and sensitive evidence must use private vulnerability
reporting described in `SECURITY.md`, not this public PR.
