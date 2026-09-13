#!/usr/bin/env python3
"""Verify exact commit ranges, SSH signatures and DCO trailers for P1."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ZERO_SHA = "0" * 40
SHA_RE = re.compile(r"^[0-9a-f]{40}$")
IDENTITY_RE = re.compile(r"^(.+?) <([^<>\s]+@[^<>\s]+)>$")
CANONICAL_SIGNOFF = "Daniel David <ddcandales@gmail.com>"


class CommitPolicyError(Exception):
    pass


def git(root: Path, *arguments: str, input_text: str | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    command = ["git", "-C", str(root), *arguments]
    result = subprocess.run(command, input=input_text, text=True, capture_output=True)
    if check and result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        raise CommitPolicyError(f"git {' '.join(arguments)} failed: {detail}")
    return result


def commit_object(root: Path, sha: str) -> str:
    if not SHA_RE.fullmatch(sha):
        raise CommitPolicyError(f"invalid commit SHA: {sha!r}")
    git(root, "cat-file", "-e", f"{sha}^{{commit}}")
    return git(root, "cat-file", "commit", sha).stdout


def author_and_message(root: Path, sha: str) -> tuple[str, str]:
    output = git(root, "show", "-s", "--format=%an%x00%ae%x00%B", sha).stdout
    parts = output.split("\0", 2)
    if len(parts) != 3:
        raise CommitPolicyError(f"cannot parse author/message for {sha}")
    return f"{parts[0]} <{parts[1]}>", parts[2]


def parse_trailers(root: Path, message: str) -> list[tuple[str, str]]:
    output = git(root, "interpret-trailers", "--parse", input_text=message).stdout
    trailers: list[tuple[str, str]] = []
    for line in output.splitlines():
        if ":" not in line:
            raise CommitPolicyError(f"malformed parsed trailer: {line!r}")
        key, value = line.split(":", 1)
        trailers.append((key.strip().lower(), value.strip()))
    return trailers


def validate_identity(value: str, label: str) -> str:
    match = IDENTITY_RE.fullmatch(value)
    if not match or "\n" in value or "\r" in value:
        raise CommitPolicyError(f"malformed {label}: {value!r}")
    return f"{match.group(1)} <{match.group(2)}>"


def verify_dco(root: Path, sha: str, github_squash: bool = False) -> None:
    author, message = author_and_message(root, sha)
    trailers = parse_trailers(root, message)
    signoffs = [validate_identity(value, "Signed-off-by") for key, value in trailers if key == "signed-off-by"]
    coauthors = [validate_identity(value, "Co-authored-by") for key, value in trailers if key == "co-authored-by"]
    if len(signoffs) != len(set(signoffs)):
        raise CommitPolicyError(f"{sha}: duplicate Signed-off-by trailer")
    if github_squash:
        if CANONICAL_SIGNOFF not in signoffs:
            raise CommitPolicyError(f"{sha}: native squash lacks canonical DCO trailer")
    elif author not in signoffs:
        raise CommitPolicyError(f"{sha}: author {author} lacks matching final DCO trailer")
    for coauthor in coauthors:
        if coauthor not in signoffs:
            raise CommitPolicyError(f"{sha}: co-author {coauthor} lacks a truthful DCO trailer")


def verify_ssh_signature(root: Path, sha: str, allowed_signers: Path) -> None:
    raw = commit_object(root, sha)
    if "gpgsig -----BEGIN SSH SIGNATURE-----" not in raw:
        raise CommitPolicyError(f"{sha}: missing SSH commit signature")
    result = git(
        root,
        "-c", "gpg.format=ssh",
        "-c", f"gpg.ssh.allowedSignersFile={allowed_signers}",
        "-c", "gpg.ssh.program=/usr/bin/ssh-keygen",
        "verify-commit", sha,
        check=False,
    )
    if result.returncode != 0 or "Good \"git\" signature for ddcandales@gmail.com" not in (result.stdout + result.stderr):
        raise CommitPolicyError(f"{sha}: SSH signature is not valid for the allowed signer")


def parents(root: Path, sha: str) -> list[str]:
    line = git(root, "rev-list", "--parents", "-n", "1", sha).stdout.strip().split()
    if not line or line[0] != sha:
        raise CommitPolicyError(f"cannot resolve parents for {sha}")
    return line[1:]


def range_commits(root: Path, base: str, head: str) -> list[str]:
    commit_object(root, head)
    if not SHA_RE.fullmatch(base) or base == ZERO_SHA:
        raise CommitPolicyError("empty or invalid commit range base")
    commit_object(root, base)
    if git(root, "merge-base", "--is-ancestor", base, head, check=False).returncode != 0:
        raise CommitPolicyError("commit range base is not an ancestor of head")
    commits = git(root, "rev-list", "--reverse", f"{base}..{head}").stdout.split()
    if not commits:
        raise CommitPolicyError("empty commit range")
    return commits


def api_json(url: str, token: str) -> object:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "noeos-verifactu-governance",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.load(response)
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        raise CommitPolicyError(f"GitHub verification API request failed for {url}") from exc


def verify_github_squash(root: Path, sha: str, repository: str, api_url: str, token: str) -> str:
    raw = commit_object(root, sha)
    if "gpgsig -----BEGIN PGP SIGNATURE-----" not in raw:
        raise CommitPolicyError(f"{sha}: protected-main commit is not a GitHub GPG-signed native squash")
    commit = api_json(f"{api_url}/repos/{repository}/commits/{sha}", token)
    if not isinstance(commit, dict) or commit.get("sha") != sha:
        raise CommitPolicyError(f"{sha}: GitHub commit response has the wrong subject")
    verification = commit.get("commit", {}).get("verification", {})
    if verification.get("verified") is not True or verification.get("reason") != "valid":
        raise CommitPolicyError(f"{sha}: GitHub does not report a valid verified signature")
    if commit.get("committer", {}).get("login") != "web-flow":
        raise CommitPolicyError(f"{sha}: unexpected native squash committer")
    pulls = api_json(f"{api_url}/repos/{repository}/commits/{sha}/pulls", token)
    candidates = [
        pull for pull in pulls if isinstance(pull, dict)
        and pull.get("merge_commit_sha") == sha
        and pull.get("merged_at")
        and pull.get("base", {}).get("ref") == "main"
    ] if isinstance(pulls, list) else []
    if len(candidates) != 1:
        raise CommitPolicyError(f"{sha}: commit does not map to exactly one merged main PR")
    return str(candidates[0]["number"])


def default_branch_head(repository: str, api_url: str, token: str) -> str:
    if not token:
        raise CommitPolicyError("GitHub token is required to resolve a new-branch range")
    metadata = api_json(f"{api_url}/repos/{repository}", token)
    branch = metadata.get("default_branch") if isinstance(metadata, dict) else None
    if not isinstance(branch, str) or not branch:
        raise CommitPolicyError("repository API lacks a default branch")
    encoded = urllib.parse.quote(branch, safe="")
    commit = api_json(f"{api_url}/repos/{repository}/commits/{encoded}", token)
    sha = commit.get("sha") if isinstance(commit, dict) else None
    if not isinstance(sha, str) or not SHA_RE.fullmatch(sha):
        raise CommitPolicyError("default-branch API response lacks a commit SHA")
    return sha


def check_policy(
    root: Path,
    event: str,
    base: str,
    head: str,
    ref: str,
    repository: str,
    api_url: str,
    token: str,
    allowed_signers: Path,
) -> dict[str, object]:
    head = head.lower()
    raw_parents = parents(root, head)
    mode: str
    pull_number: str | None = None
    if event == "pull_request":
        commits = range_commits(root, base.lower(), head)
        mode = "pull-request-ssh"
        for sha in commits:
            verify_ssh_signature(root, sha, allowed_signers)
            verify_dco(root, sha)
    elif event in {"push", "workflow_dispatch"} and ref == "refs/heads/main" and raw_parents:
        if not token:
            raise CommitPolicyError("GitHub token is required to verify a native squash")
        pull_number = verify_github_squash(root, head, repository, api_url, token)
        verify_dco(root, head, github_squash=True)
        commits = [head]
        mode = "protected-main-native-squash"
    elif event in {"push", "workflow_dispatch"} and not raw_parents:
        commits = [head]
        mode = "one-time-root-bootstrap"
        verify_ssh_signature(root, head, allowed_signers)
        verify_dco(root, head)
    elif event == "push":
        effective_base = base.lower()
        if effective_base == ZERO_SHA:
            effective_base = default_branch_head(repository, api_url, token)
            mode = "new-branch-push-ssh"
        else:
            mode = "branch-push-ssh"
        commits = range_commits(root, effective_base, head)
        for sha in commits:
            verify_ssh_signature(root, sha, allowed_signers)
            verify_dco(root, sha)
    else:
        raise CommitPolicyError(f"unsupported policy event/ref: {event} {ref}")
    return {
        "schemaVersion": 1,
        "result": "passed",
        "mode": mode,
        "headSha": head,
        "commitCount": len(commits),
        "commits": commits,
        "pullRequest": pull_number,
        "signaturePolicy": "SSH allowed signer for branch/root; GitHub verified GPG native squash for protected main",
        "dcoPolicy": "trailer-aware author/co-author verification",
    }


def self_test() -> dict[str, object]:
    tests: list[str] = []

    def expect_failure(name: str, function, contains: str) -> None:
        try:
            function()
        except CommitPolicyError as exc:
            if contains not in str(exc):
                raise CommitPolicyError(f"self-test {name} failed for wrong reason: {exc}") from exc
            tests.append(name)
            return
        raise CommitPolicyError(f"self-test {name} unexpectedly passed")

    with tempfile.TemporaryDirectory(prefix="verifactu-commit-policy-") as directory:
        root = Path(directory)
        git(root, "init", "-q")
        git(root, "config", "user.name", "Daniel David")
        git(root, "config", "user.email", "ddcandales@gmail.com")
        git(root, "config", "gpg.format", "ssh")
        git(root, "config", "gpg.ssh.program", "/usr/bin/ssh-keygen")
        good = root / "good"
        bad = root / "bad"
        for key in (good, bad):
            subprocess.run(["/usr/bin/ssh-keygen", "-q", "-t", "ed25519", "-N", "", "-f", str(key)], check=True)
        allowed = root / "allowed-signers"
        public = good.with_suffix(".pub").read_text(encoding="utf-8").split()
        allowed.write_text(f"ddcandales@gmail.com namespaces=\"git\" {public[0]} {public[1]}\n", encoding="utf-8")
        git(root, "config", "user.signingkey", str(good))

        def create(message: str, signed: bool = True, key: Path | None = None) -> str:
            arguments = ["commit", "--allow-empty"]
            if signed:
                arguments += [f"--gpg-sign={key or good}"]
            else:
                arguments += ["--no-gpg-sign"]
            arguments += ["-m", message]
            git(root, *arguments)
            return git(root, "rev-parse", "HEAD").stdout.strip()

        valid = create("test: valid\n\nSigned-off-by: Daniel David <ddcandales@gmail.com>")
        verify_ssh_signature(root, valid, allowed)
        verify_dco(root, valid)
        tests.append("valid-ssh-and-dco")

        unsigned = create("test: unsigned\n\nSigned-off-by: Daniel David <ddcandales@gmail.com>", signed=False)
        expect_failure("unsigned-commit", lambda: verify_ssh_signature(root, unsigned, allowed), "missing SSH")

        wrong = create("test: wrong signer\n\nSigned-off-by: Daniel David <ddcandales@gmail.com>", key=bad)
        expect_failure("untrusted-signer", lambda: verify_ssh_signature(root, wrong, allowed), "not valid")

        missing = create("test: missing dco")
        expect_failure("missing-dco", lambda: verify_dco(root, missing), "lacks matching")

        body_only = create("test: body text\n\nSigned-off-by: Daniel David <ddcandales@gmail.com>\n\nNot a trailer.")
        expect_failure("body-text-is-not-dco", lambda: verify_dco(root, body_only), "lacks matching")

        coauthor = create(
            "test: coauthor\n\nCo-authored-by: Example Person <example@example.invalid>\n"
            "Signed-off-by: Daniel David <ddcandales@gmail.com>"
        )
        expect_failure("coauthor-without-signoff", lambda: verify_dco(root, coauthor), "co-author")

        duplicate = create(
            "test: duplicate\n\nSigned-off-by: Daniel David <ddcandales@gmail.com>\n"
            "Signed-off-by: Daniel David <ddcandales@gmail.com>"
        )
        expect_failure("duplicate-dco", lambda: verify_dco(root, duplicate), "duplicate")

        expect_failure("empty-range", lambda: range_commits(root, duplicate, duplicate), "empty commit range")
        expect_failure("zero-base-range", lambda: range_commits(root, ZERO_SHA, duplicate), "empty or invalid")

    return {"schemaVersion": 1, "result": "passed", "negativeFixtures": tests}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--event", choices=["pull_request", "push", "workflow_dispatch"])
    parser.add_argument("--base", default=ZERO_SHA)
    parser.add_argument("--head")
    parser.add_argument("--ref", default="")
    parser.add_argument("--repository", default="noeos/verifactu")
    parser.add_argument("--api-url", default="https://api.github.com")
    parser.add_argument("--allowed-signers", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    try:
        if args.self_test:
            result = self_test()
        else:
            if not args.event or not args.head:
                raise CommitPolicyError("event and head are required")
            allowed = args.allowed_signers or args.root / ".github/policy/allowed-signers"
            result = check_policy(
                args.root.resolve(), args.event, args.base, args.head, args.ref,
                args.repository, args.api_url, os.environ.get("GITHUB_TOKEN", ""), allowed.resolve(),
            )
    except (CommitPolicyError, OSError, subprocess.SubprocessError) as exc:
        print(json.dumps({"schemaVersion": 1, "result": "failed", "diagnostic": str(exc)}, sort_keys=True))
        return 1
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
