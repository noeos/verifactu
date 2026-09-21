#!/usr/bin/env python3
"""Read-only, redacted P1 audit of effective GitHub repository state."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO = "noeos/verifactu"
ROOT = Path(__file__).resolve().parents[2]
REQUIRED_CONTEXTS = {
    item["context"]
    for item in json.loads(
        (ROOT / "config/ci/required-checks.json").read_text(encoding="utf-8")
    )["checks"]
}
DESIRED_STATE = json.loads(
    (ROOT / ".github/policy/github-desired-state.json").read_text(encoding="utf-8")
)
EXPECTED_WORKFLOWS = {
    (item["name"], item["path"], item["state"])
    for item in DESIRED_STATE["workflows"]
}


def api(endpoint: str) -> dict[str, Any]:
    current = endpoint
    pages: list[Any] = []
    statuses_seen: list[int] = []
    page_digests: list[str] = []
    seen: set[str] = set()
    process = None
    while current and current not in seen:
        seen.add(current)
        process = subprocess.run(
            ["gh", "api", "--include", "-H", "Accept: application/vnd.github+json", current],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        combined = process.stdout + ("\n" + process.stderr if process.stderr else "")
        statuses = re.findall(r"(?m)^HTTP/\S+\s+(\d{3})", combined)
        status = int(statuses[-1]) if statuses else (200 if process.returncode == 0 else 0)
        statuses_seen.append(status)
        body: Any = None
        for candidate in reversed(re.split(r"\r?\n\r?\n", process.stdout)):
            candidate = candidate.strip()
            if not candidate:
                continue
            try:
                body = json.loads(candidate)
                break
            except json.JSONDecodeError:
                continue
        pages.append(body)
        page_digests.append(hashlib.sha256(json.dumps(body, sort_keys=True, ensure_ascii=False).encode()).hexdigest())
        link = re.search(r'(?im)^link:\s*.*?<([^>]+)>;\s*rel="next"', process.stdout)
        current = link.group(1) if link else ""
    status = statuses_seen[-1]
    body = pages[0] if pages else None
    if len(pages) > 1 and all(isinstance(page, list) for page in pages):
        body = [item for page in pages for item in page]
    elif len(pages) > 1 and all(isinstance(page, dict) for page in pages):
        body = dict(pages[0])
        for key, value in list(body.items()):
            if isinstance(value, list):
                body[key] = [item for page in pages for item in page.get(key, [])]
    raw_digest = hashlib.sha256("\n".join(page_digests).encode()).hexdigest()
    if status in (200, 201, 204):
        state = "verified"
    elif status == 422:
        state = "not-applicable"
    elif status == 403:
        state = "inaccessible"
    elif status == 404:
        state = "not-found"
    else:
        state = "error"
    count = None
    if isinstance(body, list):
        count = len(body)
    elif isinstance(body, dict):
        for key in ("total_count", "totalCount"):
            if isinstance(body.get(key), int):
                count = body[key]
                break
    return {"endpoint": endpoint, "status": status, "state": state, "count": count, "responseSha256": raw_digest, "body": body}


def check(rows: list[dict[str, Any]], control: str, expected: Any, actual: Any) -> None:
    rows.append({"control": control, "expected": expected, "actual": actual, "result": "pass" if actual == expected else "fail"})


def rule_map(ruleset: dict[str, Any]) -> dict[str, Any]:
    return {rule["type"]: rule.get("parameters", True) for rule in ruleset.get("rules", [])}


def audit(subject: str, check_subject: str) -> dict[str, Any]:
    endpoints = [
        f"repos/{REPO}",
        f"repos/{REPO}/actions/permissions",
        f"repos/{REPO}/actions/permissions/selected-actions",
        f"repos/{REPO}/actions/permissions/workflow",
        f"repos/{REPO}/actions/permissions/fork-pr-contributor-approval",
        f"repos/{REPO}/actions/permissions/artifact-and-log-retention",
        f"repos/{REPO}/actions/permissions/access",
        f"repos/{REPO}/private-vulnerability-reporting",
        f"repos/{REPO}/automated-security-fixes",
        f"repos/{REPO}/vulnerability-alerts",
        f"repos/{REPO}/code-scanning/alerts?state=open&per_page=100",
        f"repos/{REPO}/dependabot/alerts?state=open&per_page=100",
        f"repos/{REPO}/secret-scanning/alerts?state=open&per_page=100",
        f"repos/{REPO}/rulesets",
        f"repos/{REPO}/branches/main/protection",
        f"repos/{REPO}/branches?per_page=100",
        f"repos/{REPO}/pulls?state=open&per_page=100",
        f"repos/{REPO}/environments?per_page=100",
        f"repos/{REPO}/actions/secrets?per_page=100",
        f"repos/{REPO}/actions/variables?per_page=100",
        f"repos/{REPO}/dependabot/secrets?per_page=100",
        f"repos/{REPO}/hooks?per_page=100",
        f"repos/{REPO}/keys?per_page=100",
        f"repos/{REPO}/teams?per_page=100",
        f"repos/{REPO}/invitations?per_page=100",
        f"repos/{REPO}/actions/runners?per_page=100",
        f"repos/{REPO}/collaborators?affiliation=all&per_page=100",
        f"repos/{REPO}/installations?per_page=100",
        f"repos/{REPO}/actions/workflows?per_page=100",
        f"repos/{REPO}/actions/runs?head_sha={check_subject}&per_page=100",
        f"repos/{REPO}/commits/{check_subject}/check-runs?per_page=100",
        f"repos/{REPO}/commits/{check_subject}/status",
        "orgs/noeos",
        "orgs/noeos/rulesets?per_page=100",
        "orgs/noeos/actions/permissions",
        "orgs/noeos/actions/permissions/workflow",
        "orgs/noeos/actions/permissions/artifact-and-log-retention",
        "orgs/noeos/actions/runners?per_page=100",
        "orgs/noeos/actions/secrets?per_page=100",
        "orgs/noeos/actions/variables?per_page=100",
        "orgs/noeos/hooks?per_page=100",
        "orgs/noeos/installations?per_page=100",
    ]
    observed = {item["endpoint"]: item for item in (api(endpoint) for endpoint in endpoints)}
    rows: list[dict[str, Any]] = []
    repo = observed[f"repos/{REPO}"]["body"] or {}
    expected_repo = {
        "default_branch": "main", "visibility": "public", "has_issues": True,
        "has_projects": False, "has_wiki": False, "has_discussions": False,
        "allow_squash_merge": True, "allow_merge_commit": False,
        "allow_rebase_merge": False, "allow_auto_merge": False,
        "delete_branch_on_merge": True, "allow_update_branch": False,
        "squash_merge_commit_title": "PR_TITLE", "squash_merge_commit_message": "PR_BODY",
        "web_commit_signoff_required": True,
    }
    for key, expected in expected_repo.items():
        check(rows, f"repository.{key}", expected, repo.get(key))
    security = repo.get("security_and_analysis", {})
    for key in ("dependabot_security_updates", "secret_scanning", "secret_scanning_push_protection"):
        check(rows, f"security.{key}", "enabled", (security.get(key) or {}).get("status"))
    for key in ("secret_scanning_validity_checks", "secret_scanning_non_provider_patterns"):
        actual = (security.get(key) or {}).get("status", "not-exposed")
        rows.append({"control": f"security.{key}", "expected": "capability-dependent; explicit", "actual": actual, "result": "pass" if actual in {"enabled", "disabled", "not-exposed"} else "fail"})

    actions = observed[f"repos/{REPO}/actions/permissions"]["body"] or {}
    for key, expected in {"enabled": True, "allowed_actions": "selected", "sha_pinning_required": True}.items():
        check(rows, f"actions.{key}", expected, actions.get(key))
    selected = observed[f"repos/{REPO}/actions/permissions/selected-actions"]["body"] or {}
    for key, expected in {
        "github_owned_allowed": True,
        "verified_allowed": False,
        "patterns_allowed": DESIRED_STATE["actions"]["patternsAllowed"],
    }.items():
        check(rows, f"actions.selected.{key}", expected, selected.get(key))
    workflow = observed[f"repos/{REPO}/actions/permissions/workflow"]["body"] or {}
    check(rows, "actions.default_workflow_permissions", "read", workflow.get("default_workflow_permissions"))
    check(rows, "actions.can_approve_pull_request_reviews", False, workflow.get("can_approve_pull_request_reviews"))
    fork = observed[f"repos/{REPO}/actions/permissions/fork-pr-contributor-approval"]["body"] or {}
    check(rows, "actions.fork_approval", "all_external_contributors", fork.get("approval_policy"))
    retention = observed[f"repos/{REPO}/actions/permissions/artifact-and-log-retention"]["body"] or {}
    check(rows, "actions.retention_days", 90, retention.get("days"))
    check(rows, "actions.external_workflow_access", 422, observed[f"repos/{REPO}/actions/permissions/access"]["status"])

    for endpoint, key in (
        (f"repos/{REPO}/private-vulnerability-reporting", "security.private_vulnerability_reporting"),
        (f"repos/{REPO}/automated-security-fixes", "security.automated_security_fixes"),
    ):
        check(rows, key, True, (observed[endpoint]["body"] or {}).get("enabled"))
    check(rows, "security.dependency_graph", 204, observed[f"repos/{REPO}/vulnerability-alerts"]["status"])
    check(rows, "security.code_scanning_not_configured", 404, observed[f"repos/{REPO}/code-scanning/alerts?state=open&per_page=100"]["status"])
    check(rows, "security.dependabot_open_alerts", 0, observed[f"repos/{REPO}/dependabot/alerts?state=open&per_page=100"]["count"])
    check(rows, "security.secret_scanning_open_alerts", 0, observed[f"repos/{REPO}/secret-scanning/alerts?state=open&per_page=100"]["count"])

    rulesets = observed[f"repos/{REPO}/rulesets"]["body"] or []
    by_name = {item.get("name"): api(f"repos/{REPO}/rulesets/{item['id']}")["body"] for item in rulesets}
    check(rows, "rulesets.names", {"protected-main", "immutable-release-tags"}, set(by_name))
    main = by_name.get("protected-main") or {}
    tags = by_name.get("immutable-release-tags") or {}
    for label, item, target, include in (
        ("main", main, "branch", ["~DEFAULT_BRANCH"]),
        ("tags", tags, "tag", ["refs/tags/v*"]),
    ):
        check(rows, f"rulesets.{label}.enforcement", "active", item.get("enforcement"))
        check(rows, f"rulesets.{label}.target", target, item.get("target"))
        check(rows, f"rulesets.{label}.bypass", [], item.get("bypass_actors"))
        check(rows, f"rulesets.{label}.include", include, ((item.get("conditions") or {}).get("ref_name") or {}).get("include"))
        check(rows, f"rulesets.{label}.exclude", [], ((item.get("conditions") or {}).get("ref_name") or {}).get("exclude"))
    main_rules = rule_map(main)
    tag_rules = rule_map(tags)
    for rule in ("deletion", "non_fast_forward", "required_linear_history", "required_signatures", "pull_request", "required_status_checks"):
        check(rows, f"rulesets.main.rule.{rule}", True, rule in main_rules)
    for rule in ("deletion", "non_fast_forward", "required_signatures"):
        check(rows, f"rulesets.tags.rule.{rule}", True, rule in tag_rules)
    pr = main_rules.get("pull_request", {})
    for key, expected in {
        "required_approving_review_count": 0, "require_code_owner_review": False,
        "require_last_push_approval": False, "required_review_thread_resolution": True,
        "require_extra_approval_for_unattributed_changes": False, "allowed_merge_methods": ["squash"],
    }.items():
        check(rows, f"rulesets.main.pull_request.{key}", expected, pr.get(key))
    status = main_rules.get("required_status_checks", {})
    check(rows, "rulesets.main.status.strict", True, status.get("strict_required_status_checks_policy"))
    contexts = {(item.get("context"), item.get("integration_id")) for item in status.get("required_status_checks", [])}
    check(rows, "rulesets.main.status.contexts", {(name, 15368) for name in REQUIRED_CONTEXTS}, contexts)
    check(rows, "rulesets.classic_protection_absent", 404, observed[f"repos/{REPO}/branches/main/protection"]["status"])
    branches = observed[f"repos/{REPO}/branches?per_page=100"]["body"] or []
    open_pulls = observed[f"repos/{REPO}/pulls?state=open&per_page=100"]["body"] or []
    bot_refs = sorted(
        item["head"]["ref"]
        for item in open_pulls
        if (item.get("user") or {}).get("login") == "dependabot[bot]"
        and (item.get("base") or {}).get("ref") == "main"
        and (item.get("head") or {}).get("ref", "").startswith("dependabot/")
    )
    check(rows, "branches.admitted", sorted(["main", *bot_refs]), sorted(item.get("name") for item in branches))
    check(rows, "branches.main.ruleset_protected", True, next((item.get("protected") for item in branches if item.get("name") == "main"), None))

    for endpoint in (
        f"repos/{REPO}/environments?per_page=100", f"repos/{REPO}/actions/secrets?per_page=100",
        f"repos/{REPO}/actions/variables?per_page=100", f"repos/{REPO}/dependabot/secrets?per_page=100",
        f"repos/{REPO}/hooks?per_page=100", f"repos/{REPO}/keys?per_page=100",
        f"repos/{REPO}/teams?per_page=100", f"repos/{REPO}/invitations?per_page=100",
        f"repos/{REPO}/actions/runners?per_page=100",
    ):
        item = observed[endpoint]
        count = item["count"] if item["count"] is not None else (len(item["body"]) if isinstance(item["body"], list) else None)
        check(rows, f"empty.{endpoint}", 0, count)

    workflows = observed[f"repos/{REPO}/actions/workflows?per_page=100"]["body"] or {}
    workflow_rows = workflows.get("workflows", [])
    check(rows, "workflows.exact", EXPECTED_WORKFLOWS, {
        (item.get("name"), item.get("path"), item.get("state")) for item in workflow_rows
    })
    checks = observed[f"repos/{REPO}/commits/{check_subject}/check-runs?per_page=100"]["body"] or {}
    producers = {(item.get("name"), (item.get("app") or {}).get("id"), item.get("conclusion")) for item in checks.get("check_runs", []) if item.get("name") in REQUIRED_CONTEXTS}
    check(rows, "checks.required_producers", {(name, 15368, "success") for name in REQUIRED_CONTEXTS}, producers)
    runs = observed[f"repos/{REPO}/actions/runs?head_sha={check_subject}&per_page=100"]["body"] or {}
    run_rows = runs.get("workflow_runs", [])
    run_identity = {(item.get("head_sha"), item.get("event"), item.get("path"), item.get("conclusion")) for item in run_rows}
    check(
        rows,
        "checks.required_workflow_run",
        True,
        (check_subject, "pull_request", ".github/workflows/required.yml", "success") in run_identity,
    )
    check(
        rows,
        "checks.workflow_run_paths_admitted",
        True,
        all(identity[2] in {path for _, path, _ in EXPECTED_WORKFLOWS} for identity in run_identity),
    )
    combined = observed[f"repos/{REPO}/commits/{check_subject}/status"]["body"] or {}
    check(rows, "checks.legacy_status_producers", 0, combined.get("total_count"))

    collaborators = observed[f"repos/{REPO}/collaborators?affiliation=all&per_page=100"]["body"] or []
    collaborator_roles = sorted((item.get("login"), item.get("role_name")) for item in collaborators)
    check(rows, "access.collaborators", [("ddavid07", "admin")], collaborator_roles)
    repo_installations = observed[f"repos/{REPO}/installations?per_page=100"]
    rows.append({"control": "access.repository_installations_visibility", "expected": "explicit inaccessible/not-found", "actual": {"state": repo_installations["state"], "status": repo_installations["status"]}, "result": "pass" if repo_installations["state"] in {"inaccessible", "not-found"} else "fail"})

    org = observed["orgs/noeos"]["body"] or {}
    check(rows, "organization.two_factor_requirement_enabled", True, org.get("two_factor_requirement_enabled"))
    check(rows, "organization.default_repository_permission", "read", org.get("default_repository_permission"))
    unknowns = []
    for endpoint in endpoints:
        if endpoint.startswith("orgs/noeos/") and observed[endpoint]["state"] in {"inaccessible", "not-found"}:
            unknowns.append({"endpoint": endpoint, "state": observed[endpoint]["state"], "status": observed[endpoint]["status"]})
    if repo_installations["state"] in {"inaccessible", "not-found"}:
        unknowns.append({"endpoint": repo_installations["endpoint"], "state": repo_installations["state"], "status": repo_installations["status"]})

    public_observations = [{key: value for key, value in item.items() if key != "body"} for item in observed.values()]
    failed = [row for row in rows if row["result"] != "pass"]
    return {
        "schemaVersion": 1,
        "claim": "maintainer-authenticated read-only effective-state audit",
        "repository": REPO,
        "subject": subject,
        "requiredCheckSubject": check_subject,
        "observedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "status": "passed" if not failed else "failed",
        "checksPassed": len(rows) - len(failed),
        "checksTotal": len(rows),
        "checks": rows,
        "observations": public_observations,
        "explicitUnknownOrganizationSurfaces": unknowns,
        "limitations": [
            "No response body containing secret, variable, hook, app, collaborator, or audit-log detail is retained.",
            "Organization administrative 403/404 surfaces are explicit unknowns, not evidence of absence.",
            "GitHub tag required-signature rules accept a lightweight tag pointing to a signed commit; annotated release-tag identity remains a later release gate.",
            "This audit does not claim product implementation, external review, publication, or legal validation."
        ],
    }


def json_safe(value: Any) -> Any:
    if isinstance(value, set):
        return sorted([json_safe(item) for item in value], key=lambda item: json.dumps(item, sort_keys=True, ensure_ascii=False))
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [json_safe(item) for item in value]
    return value


def authority_boundary(output: Path | None) -> dict[str, Any]:
    repository = api(f"repos/{REPO}")
    administration = api(f"repos/{REPO}/rulesets")
    report = {
        "schemaVersion": 1,
        "status": "passed"
        if repository["status"] == 200
        and administration["state"] in {"inaccessible", "not-found"}
        else "failed",
        "claim": "ephemeral workflow token authority boundary",
        "repositoryRead": {key: repository[key] for key in ("status", "state", "responseSha256")},
        "administrationRead": {key: administration[key] for key in ("status", "state", "responseSha256")},
        "limitation": "This is not a maintainer-authenticated effective-state audit.",
    }
    encoded = json_safe(report)
    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(encoded, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return encoded


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject")
    parser.add_argument("--check-subject", help="PR head whose required producers are observed; defaults to subject")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--authority-boundary", action="store_true")
    args = parser.parse_args()
    if args.authority_boundary:
        report = authority_boundary(args.output)
        print(json.dumps(report, indent=2, sort_keys=True) + "\n", end="")
        return 0 if report["status"] == "passed" else 1
    if not args.subject:
        parser.error("--subject is required unless --authority-boundary is used")
    report = json_safe(audit(args.subject, args.check_subject or args.subject))
    encoded = json.dumps(report, indent=2, ensure_ascii=False, sort_keys=True) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded, encoding="utf-8")
    print(encoded, end="")
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
