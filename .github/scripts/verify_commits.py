#!/usr/bin/env python3
"""Verify every PR commit's SSH signature and DCO attribution."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path


IDENTITY_RE = re.compile(r"^(?P<name>.+?) <(?P<email>[^<>\s]+)>$")


def run(*args: str, cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=cwd, check=check, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def trailer_errors(message: str, author: str, email: str) -> list[str]:
    process = subprocess.run(["git", "interpret-trailers", "--parse"], input=message, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if process.returncode:
        return ["unable to parse trailers"]
    trailers: list[tuple[str, str]] = []
    for line in process.stdout.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            trailers.append((key.strip().lower(), value.strip()))
    expected = f"{author} <{email}>"
    signoffs = [value for key, value in trailers if key == "signed-off-by"]
    errors: list[str] = []
    if signoffs.count(expected) != 1 or len(signoffs) != 1:
        errors.append(f"expected exactly one author Signed-off-by trailer {expected!r}")
    coauthors = [value for key, value in trailers if key == "co-authored-by"]
    for coauthor in coauthors:
        if not IDENTITY_RE.match(coauthor):
            errors.append(f"malformed Co-authored-by trailer {coauthor!r}")
        elif signoffs.count(coauthor) != 1:
            errors.append(f"coauthor lacks exactly one matching signoff {coauthor!r}")
    return errors


def commits(base: str, head: str) -> list[str]:
    run("git", "merge-base", "--is-ancestor", base, head)
    values = run("git", "rev-list", "--reverse", f"{base}..{head}").stdout.splitlines()
    if not values:
        raise ValueError("empty PR commit range")
    return values


def verify(base: str, head: str, allowed_signers: Path) -> list[dict[str, object]]:
    results: list[dict[str, object]] = []
    for commit in commits(base, head):
        fmt = "%an%x00%ae%x00%B%x00%G?%x00%GS%x00%GK"
        fields = run(
            "git", "-c", "gpg.format=ssh", "-c", f"gpg.ssh.allowedSignersFile={allowed_signers}",
            "show", "-s", f"--format={fmt}", commit,
        ).stdout.split("\x00")
        author, email, message, validity, signer, key = fields[:6]
        issues = trailer_errors(message, author, email)
        checked = run(
            "git", "-c", "gpg.format=ssh", "-c", f"gpg.ssh.allowedSignersFile={allowed_signers}",
            "verify-commit", commit, check=False,
        )
        if checked.returncode:
            issues.append("signature is absent, invalid, revoked, or not admitted")
        if validity != "G" or signer != "ddcandales@gmail.com":
            issues.append(f"unexpected local signature identity/status {signer!r}/{validity!r}")
        results.append({"commit": commit, "author": f"{author} <{email}>", "signer": signer, "key": key, "status": "passed" if not issues else "failed", "errors": issues})
    return results


def self_test() -> None:
    assert not trailer_errors("subject\n\nSigned-off-by: A B <a@example.test>\n", "A B", "a@example.test")
    assert trailer_errors("subject\n", "A B", "a@example.test")
    assert trailer_errors("subject\n\ntext Signed-off-by: A B <a@example.test>\n", "A B", "a@example.test")
    assert trailer_errors("subject\n\nCo-authored-by: C D <c@example.test>\nSigned-off-by: A B <a@example.test>\n", "A B", "a@example.test")
    assert trailer_errors("subject\n\nSigned-off-by: A B <a@example.test>\nSigned-off-by: A B <a@example.test>\n", "A B", "a@example.test")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default=os.getenv("P1_BASE_SHA"))
    parser.add_argument("--head", default=os.getenv("P1_HEAD_SHA", "HEAD"))
    parser.add_argument("--allowed-signers", type=Path, default=Path(".github/policy/allowed-signers"))
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
    if not args.base:
        print(json.dumps({"schemaVersion": 1, "status": "failed", "errors": ["base SHA is required"]}, indent=2))
        return 1
    try:
        results = verify(args.base, args.head, args.allowed_signers.resolve())
    except (subprocess.CalledProcessError, ValueError) as error:
        print(json.dumps({"schemaVersion": 1, "status": "failed", "errors": [str(error)]}, indent=2))
        return 1
    failed = [item for item in results if item["status"] != "passed"]
    print(json.dumps({"schemaVersion": 1, "base": args.base, "head": args.head, "status": "failed" if failed else "passed", "commits": results}, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
