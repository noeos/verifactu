#!/usr/bin/env python3
"""Read-only, paginated and redacted GitHub effective-state auditor for P1."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path


class AuditError(Exception):
    pass


def run_gh(endpoint: str, paginate: bool = False) -> dict[str, object]:
    executable = "/usr/bin/gh" if Path("/usr/bin/gh").exists() else "gh"
    pages: list[object] = []
    page = 1
    while True:
        separator = "&" if "?" in endpoint else "?"
        requested = f"{endpoint}{separator}per_page=100&page={page}" if paginate else endpoint
        result = subprocess.run([executable, "api", requested], text=True, capture_output=True)
        if result.returncode != 0:
            status_match = re.search(r"HTTP\s+(\d{3})", result.stderr)
            status = int(status_match.group(1)) if status_match else None
            state = "inaccessible" if status in {401, 403, 404} else "error"
            return {"state": state, "httpStatus": status, "diagnostic": result.stderr.strip()[:240]}
        try:
            current = json.loads(result.stdout) if result.stdout.strip() else None
        except json.JSONDecodeError as exc:
            raise AuditError(f"unparseable response from {requested}") from exc
        pages.append(current)
        if not paginate or not isinstance(current, list) or len(current) < 100:
            break
        page += 1
    if paginate and pages and all(isinstance(item, list) for item in pages):
        value = [entry for item in pages for entry in item]
    else:
        value = pages[0] if pages else None
    canonical = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return {
        "state": "verified",
        "sha256": hashlib.sha256(canonical).hexdigest(),
        "value": value,
    }


def value(observation: dict[str, object], label: str):
    if observation.get("state") != "verified":
        raise AuditError(f"{label} is not verified: {observation.get('state')}")
    return observation["value"]


def count_observation(observation: dict[str, object]) -> dict[str, object]:
    result = {key: observation.get(key) for key in ("state", "httpStatus", "sha256") if observation.get(key) is not None}
    observed = observation.get("value")
    if isinstance(observed, list):
        result["count"] = len(observed)
    elif isinstance(observed, dict) and isinstance(observed.get("total_count"), int):
        result["count"] = observed["total_count"]
    elif observation.get("state") == "verified":
        result["present"] = observed is not None
    if observation.get("diagnostic"):
        result["diagnostic"] = observation["diagnostic"]
    return result


def assert_equal(checks: list[dict[str, object]], name: str, expected, observed) -> None:
    checks.append({"name": name, "result": "passed" if observed == expected else "failed", "expected": expected, "observed": observed})


def normalize_ruleset(ruleset: dict[str, object]) -> dict[str, object]:
    rules = ruleset.get("rules") or []
    rule_types = [rule.get("type") for rule in rules]
    pull = next((rule.get("parameters", {}) for rule in rules if rule.get("type") == "pull_request"), None)
    status = next((rule.get("parameters", {}) for rule in rules if rule.get("type") == "required_status_checks"), None)
    return {
        "name": ruleset.get("name"),
        "target": ruleset.get("target"),
        "enforcement": ruleset.get("enforcement"),
        "include": ruleset.get("conditions", {}).get("ref_name", {}).get("include", []),
        "exclude": ruleset.get("conditions", {}).get("ref_name", {}).get("exclude", []),
        "bypassActors": ruleset.get("bypass_actors") or [],
        "currentUserCanBypass": ruleset.get("current_user_can_bypass"),
        "ruleTypes": rule_types,
        "pullRequest": pull,
        "requiredStatusChecks": status,
    }


def audit(root: Path, policy_path: Path, subject_sha: str | None) -> dict[str, object]:
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    repository = policy["repository"]
    organization = repository.split("/", 1)[0]
    observations: dict[str, dict[str, object]] = {}

    def observe(name: str, endpoint: str, paginate: bool = False) -> dict[str, object]:
        observation = run_gh(endpoint, paginate)
        observations[name] = observation
        return observation

    repo_obs = observe("repository", f"repos/{repository}")
    actions_obs = observe("actionsPermissions", f"repos/{repository}/actions/permissions")
    workflow_permissions_obs = observe("workflowPermissions", f"repos/{repository}/actions/permissions/workflow")
    selected_obs = observe("selectedActions", f"repos/{repository}/actions/permissions/selected-actions")
    rulesets_obs = observe("rulesets", f"repos/{repository}/rulesets", True)
    branches_obs = observe("branches", f"repos/{repository}/branches", True)
    classic_obs = observe("classicMainProtection", f"repos/{repository}/branches/main/protection")
    vulnerability_obs = observe("dependabotAlertsEnabled", f"repos/{repository}/vulnerability-alerts")
    fixes_obs = observe("dependabotSecurityUpdates", f"repos/{repository}/automated-security-fixes")
    private_reporting_obs = observe("privateVulnerabilityReporting", f"repos/{repository}/private-vulnerability-reporting")

    count_endpoints = {
        "collaborators": "collaborators",
        "teams": "teams",
        "invitations": "invitations",
        "hooks": "hooks",
        "deployKeys": "keys",
        "repositoryRunners": "actions/runners",
        "actionsSecrets": "actions/secrets",
        "dependabotSecrets": "dependabot/secrets",
        "actionsVariables": "actions/variables",
        "environments": "environments",
        "workflows": "actions/workflows",
    }
    for name, endpoint in count_endpoints.items():
        observe(name, f"repos/{repository}/{endpoint}", True)

    signal_endpoints = {
        "dependabotAlerts": "dependabot/alerts?state=open&per_page=100",
        "secretScanningAlerts": "secret-scanning/alerts?state=open&per_page=100",
        "codeScanningAlerts": "code-scanning/alerts?state=open&per_page=100",
    }
    for name, endpoint in signal_endpoints.items():
        observe(name, f"repos/{repository}/{endpoint}", True)

    organization_endpoints = {
        "organizationMetadata": f"orgs/{organization}",
        "organizationActionsPermissions": f"orgs/{organization}/actions/permissions",
        "organizationRulesets": f"orgs/{organization}/rulesets",
        "organizationRunners": f"orgs/{organization}/actions/runners",
        "organizationSecrets": f"orgs/{organization}/actions/secrets",
        "organizationVariables": f"orgs/{organization}/actions/variables",
        "organizationHooks": f"orgs/{organization}/hooks",
    }
    for name, endpoint in organization_endpoints.items():
        observe(name, endpoint, True)

    rulesets_value = value(rulesets_obs, "rulesets")
    if not isinstance(rulesets_value, list):
        raise AuditError("rulesets response is not a list")
    detailed_rulesets: list[dict[str, object]] = []
    for item in rulesets_value:
        rule_id = item.get("id") if isinstance(item, dict) else None
        if not isinstance(rule_id, int):
            raise AuditError("ruleset lacks integer id")
        detail = observe(f"ruleset:{rule_id}", f"repos/{repository}/rulesets/{rule_id}")
        detailed_rulesets.append(normalize_ruleset(value(detail, f"ruleset:{rule_id}")))

    checks: list[dict[str, object]] = []
    repo = value(repo_obs, "repository")
    desired_repo = policy["repository"]
    assert_equal(checks, "repository.identity", desired_repo, repo.get("full_name"))
    assert_equal(checks, "repository.visibility", policy["visibility"], repo.get("visibility"))
    assert_equal(checks, "repository.defaultBranch", policy["defaultBranch"], repo.get("default_branch"))
    feature_map = {"issues": "has_issues", "projects": "has_projects", "wiki": "has_wiki", "discussions": "has_discussions"}
    for desired_key, api_key in feature_map.items():
        assert_equal(checks, f"features.{desired_key}", policy["features"][desired_key], repo.get(api_key))
    merge_map = {
        "squash": "allow_squash_merge", "mergeCommit": "allow_merge_commit", "rebase": "allow_rebase_merge",
        "autoMerge": "allow_auto_merge", "deleteBranchOnMerge": "delete_branch_on_merge",
        "webCommitSignoffRequired": "web_commit_signoff_required",
    }
    for desired_key, api_key in merge_map.items():
        assert_equal(checks, f"merge.{desired_key}", policy["merge"][desired_key], repo.get(api_key))

    actions = value(actions_obs, "actions permissions")
    assert_equal(checks, "actions.enabled", policy["actions"]["enabled"], actions.get("enabled"))
    assert_equal(checks, "actions.allowedActions", policy["actions"]["allowedActions"], actions.get("allowed_actions"))
    assert_equal(checks, "actions.shaPinningRequired", policy["actions"]["shaPinningRequired"], actions.get("sha_pinning_required"))
    workflow_permissions = value(workflow_permissions_obs, "workflow permissions")
    assert_equal(checks, "actions.defaultWorkflowPermissions", policy["actions"]["defaultWorkflowPermissions"], workflow_permissions.get("default_workflow_permissions"))
    assert_equal(checks, "actions.canApprovePullRequestReviews", policy["actions"]["canApprovePullRequestReviews"], workflow_permissions.get("can_approve_pull_request_reviews"))
    selected = value(selected_obs, "selected actions")
    assert_equal(checks, "actions.githubOwnedAllowed", policy["actions"]["githubOwnedAllowed"], selected.get("github_owned_allowed"))
    assert_equal(checks, "actions.verifiedAllowed", policy["actions"]["verifiedAllowed"], selected.get("verified_allowed"))
    assert_equal(checks, "actions.patternsAllowed", policy["actions"]["patternsAllowed"], selected.get("patterns_allowed") or [])

    security = repo.get("security_and_analysis") or {}
    status = lambda key: (security.get(key) or {}).get("status") == "enabled"
    assert_equal(checks, "security.dependabotAlerts", True, vulnerability_obs.get("state") == "verified")
    assert_equal(checks, "security.dependabotSecurityUpdates", True, fixes_obs.get("state") == "verified" and status("dependabot_security_updates"))
    private_reporting = private_reporting_obs.get("value") if private_reporting_obs.get("state") == "verified" else {}
    assert_equal(checks, "security.privateVulnerabilityReporting", True, isinstance(private_reporting, dict) and private_reporting.get("enabled") is True)
    assert_equal(checks, "security.secretScanning", policy["security"]["secretScanning"], status("secret_scanning"))
    assert_equal(checks, "security.secretScanningPushProtection", policy["security"]["secretScanningPushProtection"], status("secret_scanning_push_protection"))
    assert_equal(checks, "security.secretScanningNonProviderPatterns", policy["security"]["secretScanningNonProviderPatterns"], status("secret_scanning_non_provider_patterns"))
    assert_equal(checks, "security.secretScanningValidityChecks", policy["security"]["secretScanningValidityChecks"], status("secret_scanning_validity_checks"))

    by_name = {item["name"]: item for item in detailed_rulesets}
    assert_equal(
        checks,
        "rulesets.names",
        sorted([policy["mainRuleset"]["name"], policy["tagRuleset"]["name"]]),
        sorted(by_name),
    )
    main = by_name.get(policy["mainRuleset"]["name"], {})
    desired_main = policy["mainRuleset"]
    for field in ("target", "enforcement", "include", "exclude", "bypassActors"):
        assert_equal(checks, f"mainRuleset.{field}", desired_main[field], main.get(field))
    assert_equal(checks, "mainRuleset.currentUserCanBypass", "never", main.get("currentUserCanBypass"))
    expected_main_types = ["deletion", "non_fast_forward", "required_linear_history", "required_signatures", "pull_request", "required_status_checks"]
    assert_equal(checks, "mainRuleset.ruleTypes", expected_main_types, main.get("ruleTypes"))
    pull = main.get("pullRequest") or {}
    desired_pull = desired_main["rules"]["pullRequest"]
    pull_fields = {
        "requiredApprovingReviewCount": "required_approving_review_count",
        "dismissStaleReviewsOnPush": "dismiss_stale_reviews_on_push",
        "requireCodeOwnerReview": "require_code_owner_review",
        "requireLastPushApproval": "require_last_push_approval",
        "requiredReviewThreadResolution": "required_review_thread_resolution",
        "requireExtraApprovalForUnattributedChanges": "require_extra_approval_for_unattributed_changes",
        "allowedMergeMethods": "allowed_merge_methods",
    }
    for desired_key, api_key in pull_fields.items():
        assert_equal(checks, f"mainRuleset.pullRequest.{desired_key}", desired_pull[desired_key], pull.get(api_key))
    status_checks = main.get("requiredStatusChecks") or {}
    assert_equal(checks, "mainRuleset.requiredStatusChecks.strict", True, status_checks.get("strict_required_status_checks_policy"))
    assert_equal(checks, "mainRuleset.requiredStatusChecks.doNotEnforceOnCreate", False, status_checks.get("do_not_enforce_on_create"))
    actual_contexts = sorted(item.get("context") for item in status_checks.get("required_status_checks", []))
    assert_equal(checks, "mainRuleset.requiredStatusChecks.contexts", sorted(desired_main["rules"]["requiredStatusChecks"]["contexts"]), actual_contexts)

    tag = by_name.get(policy["tagRuleset"]["name"], {})
    desired_tag = policy["tagRuleset"]
    for field in ("target", "enforcement", "include", "exclude", "bypassActors"):
        assert_equal(checks, f"tagRuleset.{field}", desired_tag[field], tag.get(field))
    assert_equal(checks, "tagRuleset.currentUserCanBypass", "never", tag.get("currentUserCanBypass"))
    assert_equal(checks, "tagRuleset.ruleTypes", desired_tag["rules"], tag.get("ruleTypes"))

    assert_equal(checks, "classicMainProtection.absent", "inaccessible", classic_obs.get("state"))
    for name in ("teams", "invitations", "hooks", "deployKeys", "repositoryRunners", "actionsSecrets", "dependabotSecrets", "actionsVariables", "environments"):
        observation = count_observation(observations[name])
        assert_equal(checks, f"forbiddenSurface.{name}.count", 0, observation.get("count"))
    assert_equal(checks, "singleMaintainer.collaboratorCount", 1, count_observation(observations["collaborators"]).get("count"))
    assert_equal(checks, "branch.main.present", True, any(item.get("name") == "main" for item in value(branches_obs, "branches")))

    check_producers: dict[str, object] = {"state": "not-requested"}
    if subject_sha:
        check_runs_obs = observe("subjectCheckRuns", f"repos/{repository}/commits/{subject_sha}/check-runs?per_page=100", True)
        check_runs_value = value(check_runs_obs, "subject check runs")
        if isinstance(check_runs_value, dict):
            runs = check_runs_value.get("check_runs", [])
        else:
            runs = []
        expected_contexts = set(policy["mainRuleset"]["rules"]["requiredStatusChecks"]["contexts"])
        matching = {
            run.get("name"): {
                "conclusion": run.get("conclusion"),
                "app": (run.get("app") or {}).get("slug"),
                "headSha": run.get("head_sha"),
                "detailsUrl": run.get("details_url"),
            }
            for run in runs if run.get("name") in expected_contexts
        }
        for context in sorted(expected_contexts):
            observed = matching.get(context)
            assert_equal(checks, f"checkProducer.{context}", {"conclusion": "success", "app": "github-actions", "headSha": subject_sha}, {key: observed.get(key) for key in ("conclusion", "app", "headSha")} if observed else None)
        check_producers = {"state": "verified", "subjectSha": subject_sha, "contexts": matching}

    safe_observations = {name: count_observation(observation) for name, observation in observations.items() if not name.startswith("ruleset:") and name not in {"repository", "actionsPermissions", "workflowPermissions", "selectedActions", "rulesets", "branches"}}
    limitations = [
        {"surface": name, "state": observation.get("state"), "httpStatus": observation.get("httpStatus")}
        for name, observation in observations.items()
        if name.startswith("organization") and observation.get("state") != "verified"
    ]
    failed = [check for check in checks if check["result"] != "passed"]
    return {
        "schemaVersion": 1,
        "repository": repository,
        "observedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "subjectSha": subject_sha,
        "result": "failed" if failed else "passed",
        "checks": checks,
        "rulesets": detailed_rulesets,
        "checkProducers": check_producers,
        "surfaceObservations": safe_observations,
        "limitations": limitations,
        "signalNote": "Alert counts are observations, not conformance constants or proof of absence.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--policy", type=Path)
    parser.add_argument("--subject-sha")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    policy = args.policy or root / ".github/policy/github.json"
    try:
        report = audit(root, policy.resolve(), args.subject_sha)
    except (AuditError, OSError, json.JSONDecodeError, subprocess.SubprocessError) as exc:
        print(json.dumps({"schemaVersion": 1, "result": "error", "diagnostic": str(exc)}, sort_keys=True))
        return 2
    rendered = json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0 if report["result"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
