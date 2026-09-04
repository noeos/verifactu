// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { assertProjectRoot, projectRoot, readJson } from "./project.mjs";

await assertProjectRoot();
const expected = await readJson(resolve(projectRoot, "security/github-settings.json"));
const api = (path) => JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8" }));
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const equal = (actual, wanted, label) =>
  check(actual === wanted, `${label}: expected ${wanted}, found ${actual}`);
const sorted = (values) => [...values].sort();
const arrayEqual = (actual, wanted, label) =>
  check(JSON.stringify(sorted(actual)) === JSON.stringify(sorted(wanted)), `${label}: mismatch`);

const repo = api(`repos/${expected.repository}`);
equal(repo.visibility, expected.visibility, "visibility");
equal(repo.default_branch, expected.defaultBranch, "default branch");
for (const [field, wanted] of Object.entries({
  has_issues: expected.features.issues,
  has_wiki: expected.features.wiki,
  has_projects: expected.features.projects,
  has_discussions: expected.features.discussions,
  has_downloads: expected.features.downloads,
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: false,
  allow_auto_merge: false,
  delete_branch_on_merge: expected.deleteBranchOnMerge,
  web_commit_signoff_required: expected.webCommitSignoffRequired,
}))
  equal(repo[field], wanted, field);
equal(repo.description, expected.repositoryMetadata.description, "description");
equal(repo.homepage, expected.repositoryMetadata.homepage, "homepage");

const actions = api(`repos/${expected.repository}/actions/permissions`);
equal(actions.enabled, expected.actions.enabled, "Actions enabled");
equal(actions.allowed_actions, expected.actions.allowedActions, "Actions allowlist mode");
const workflow = api(`repos/${expected.repository}/actions/permissions/workflow`);
equal(
  workflow.default_workflow_permissions,
  expected.actions.defaultWorkflowPermissions,
  "workflow permissions",
);
equal(
  workflow.can_approve_pull_request_reviews,
  expected.actions.workflowsCanApprovePullRequests,
  "workflow PR approval",
);
const selected = api(`repos/${expected.repository}/actions/permissions/selected-actions`);
equal(
  selected.github_owned_allowed,
  expected.actions.allowedReferences.githubOwned,
  "GitHub-owned Actions",
);
equal(selected.verified_allowed, expected.actions.allowedReferences.verified, "verified Actions");
arrayEqual(
  selected.patterns_allowed,
  expected.actions.allowedReferences.patterns,
  "third-party Action patterns",
);
const forkPolicy = api(
  `repos/${expected.repository}/actions/permissions/fork-pr-contributor-approval`,
);
equal(
  forkPolicy.approval_policy,
  expected.actions.forkPullRequestApprovalPolicy,
  "fork PR approval policy",
);

const security = repo.security_and_analysis ?? {};
const automatedFixes = api(`repos/${expected.repository}/automated-security-fixes`);
equal(automatedFixes.enabled, expected.features.automatedSecurityFixes, "automated security fixes");
for (const [field, wanted] of Object.entries({
  dependabot_security_updates: expected.features.dependabotAlerts,
  secret_scanning: expected.features.secretScanning,
  secret_scanning_push_protection: expected.features.secretScanningPushProtection,
}))
  equal(security[field]?.status === "enabled", wanted, `security.${field}`);
const privateReporting = api(`repos/${expected.repository}/private-vulnerability-reporting`);
equal(
  privateReporting.enabled,
  expected.features.privateVulnerabilityReporting,
  "private vulnerability reporting",
);

const rulesets = api(`repos/${expected.repository}/rulesets`);
const details = new Map(
  rulesets.map((entry) => [entry.name, api(`repos/${expected.repository}/rulesets/${entry.id}`)]),
);
const main = details.get("Protect main");
check(Boolean(main), "missing Protect main ruleset");
if (main) {
  equal(main.enforcement, expected.branchRules.main.enforcement, "main ruleset enforcement");
  arrayEqual(main.conditions.ref_name.include, ["refs/heads/main"], "main ruleset ref");
  const types = main.rules.map((rule) => rule.type);
  for (const type of [
    "deletion",
    "non_fast_forward",
    "required_linear_history",
    "required_signatures",
    "pull_request",
    "required_status_checks",
  ])
    check(types.includes(type), `main ruleset missing ${type}`);
  const pr = main.rules.find((rule) => rule.type === "pull_request")?.parameters;
  check(
    pr?.allowed_merge_methods?.join(",") === "squash",
    "main ruleset merge methods are not squash-only",
  );
  equal(pr?.required_review_thread_resolution, true, "main conversation resolution");
  const status = main.rules.find((rule) => rule.type === "required_status_checks")?.parameters;
  equal(status?.strict_required_status_checks_policy, true, "strict required checks");
  arrayEqual(
    status?.required_status_checks?.map(({ context }) => context) ?? [],
    expected.branchRules.main.requiredChecks,
    "required checks",
  );
}
const tags = details.get("Protect release tags");
check(Boolean(tags), "missing Protect release tags ruleset");
if (tags) {
  equal(tags.enforcement, expected.tagRules["v*"].enforcement, "tag ruleset enforcement");
  arrayEqual(tags.conditions.ref_name.include, ["refs/tags/v*"], "tag ruleset ref");
  arrayEqual(
    tags.rules.map((rule) => rule.type),
    ["deletion", "update", "non_fast_forward", "required_signatures"],
    "tag rules",
  );
  equal(tags.bypass_actors?.[0]?.actor_type, "OrganizationAdmin", "tag OrganizationAdmin bypass");
  equal(tags.bypass_actors?.[0]?.bypass_mode, "always", "tag bypass mode");
}

for (const [name, wanted] of Object.entries(expected.environments)) {
  const environment = api(`repos/${expected.repository}/environments/${name}`);
  equal(environment.can_admins_bypass, wanted.canAdminsBypass, `${name} admin bypass`);
  const reviewer = environment.protection_rules?.find((rule) => rule.type === "required_reviewers");
  check(Boolean(reviewer), `${name} missing required reviewer protection`);
  if (reviewer) {
    equal(reviewer.prevent_self_review, wanted.preventSelfReview, `${name} prevent self review`);
    arrayEqual(
      reviewer.reviewers.map(({ reviewer: value }) => value.login),
      wanted.requiredReviewers,
      `${name} reviewers`,
    );
  }
  const policies =
    api(`repos/${expected.repository}/environments/${name}/deployment-branch-policies`)
      .branch_policies ?? [];
  check(
    policies.some((policy) => policy.type === "tag" && policy.name === wanted.deploymentTagPattern),
    `${name} tag policy`,
  );
}

const labels = api(`repos/${expected.repository}/labels?per_page=100`);
for (const wanted of expected.labels) {
  const actual = labels.find((label) => label.name === wanted.name);
  check(Boolean(actual), `missing label ${wanted.name}`);
  if (actual) {
    equal(actual.color.toLowerCase(), wanted.color.toLowerCase(), `label ${wanted.name} color`);
    equal(actual.description, wanted.description, `label ${wanted.name} description`);
  }
}

if (failures.length > 0) throw new Error(failures.join("\n"));
console.log(
  `GitHub configuration verified for ${expected.repository}: metadata, Actions, security, rulesets, environments and labels.`,
);
