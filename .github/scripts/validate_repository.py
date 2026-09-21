#!/usr/bin/env python3
"""Dependency-free governed repository and documentation validator."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import unquote


LINK_RE = re.compile(r"(?<!!)\[[^\]]*\]\(([^)]+)\)")
ID_RE = re.compile(r"^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
PRIVATE_RE = re.compile("BEGIN (?:OPEN" + "SSH|RSA|EC|DSA|PGP) PRIVATE KEY")
WORKSTATION_RE = re.compile("(?:/" + r"home/[^/\s]+|[A-Za-z]:\\Users\\[^\\\s]+)")
SHA_ACTION_RE = re.compile(r"^\s*uses:\s*([^#\s]+)(?:\s+#.*)?$")

REQUIRED_ROOT = {
    "README.md",
    "LICENSE",
    "NOTICE",
    "SECURITY.md",
    "CONTRIBUTING.md",
    ".gitignore",
    ".gitattributes",
    ".editorconfig",
    ".github/PULL_REQUEST_TEMPLATE.md",
    ".github/ISSUE_TEMPLATE/config.yml",
    ".github/ISSUE_TEMPLATE/work-item.yml",
    ".github/policy/allowed-signers",
    ".github/policy/github-desired-state.json",
    ".github/workflows/required.yml",
}


def fail(errors: list[str], code: str, subject: str, detail: str) -> None:
    errors.append(f"{code}: {subject}: {detail}")


def front_matter(text: str) -> dict[str, str] | None:
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        return None
    try:
        end = lines.index("---", 1)
    except ValueError:
        return None
    values: dict[str, str] = {}
    for line in lines[1:end]:
        if not line or line[0].isspace() or ":" not in line:
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip()
    return values


def slug(text: str) -> str:
    value = re.sub(r"[`*_~]", "", text.strip().lower())
    value = re.sub(r"[^\w\- ]", "", value, flags=re.UNICODE)
    return re.sub(r"[\s-]+", "-", value).strip("-")


def anchors(text: str) -> set[str]:
    found: set[str] = set()
    counts: dict[str, int] = {}
    for line in text.splitlines():
        match = HEADING_RE.match(line)
        if match:
            base = slug(match.group(2))
            count = counts.get(base, 0)
            counts[base] = count + 1
            found.add(base if count == 0 else f"{base}-{count}")
        for explicit in re.findall(r'<a\s+(?:name|id)=["\']([^"\']+)["\']', line):
            found.add(explicit)
    return found


def aggregate(paths: list[Path], root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(paths):
        item = hashlib.sha256(path.read_bytes()).hexdigest()
        digest.update(f"{item}  {path.relative_to(root).as_posix()}\n".encode())
    return digest.hexdigest()


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    for rel in sorted(REQUIRED_ROOT):
        if not (root / rel).is_file():
            fail(errors, "P1-ROOT-MISSING", rel, "required governed artifact is absent")

    for forbidden in ("CODEOWNERS", ".github/CODEOWNERS", "docs/CODEOWNERS"):
        if (root / forbidden).exists():
            fail(
                errors,
                "P1-CODEOWNERS",
                forbidden,
                "single-maintainer policy forbids CODEOWNERS",
            )
    excluded_roots = {".git", ".build-cache", "node_modules"}
    all_files = [
        p
        for p in root.rglob("*")
        if p.is_file()
        and not any(part in excluded_roots for part in p.relative_to(root).parts)
        and "evidence/runs" not in p.relative_to(root).as_posix()
    ]
    for path in all_files:
        try:
            data = path.read_bytes()
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            if path.suffix in {".md", ".json", ".yml", ".yaml", ".py"}:
                fail(
                    errors,
                    "P1-UTF8",
                    str(path.relative_to(root)),
                    "governed text is not UTF-8",
                )
            continue
        immutable_source_blob = (
            "editions/source-snapshots" in path.relative_to(root).as_posix()
        )
        if b"\r" in data and not immutable_source_blob:
            fail(errors, "P1-LF", str(path.relative_to(root)), "CR bytes are forbidden")
        if PRIVATE_RE.search(text):
            fail(
                errors,
                "P1-PRIVATE-KEY",
                str(path.relative_to(root)),
                "private-key marker found",
            )
        if (
            WORKSTATION_RE.search(text)
            and path != root / ".github/policy/p1-baseline.json"
            and "editions/source-snapshots" not in path.relative_to(root).as_posix()
        ):
            fail(
                errors,
                "P1-WORKSTATION-PATH",
                str(path.relative_to(root)),
                "workstation-specific path found",
            )

    docs = root / "docs"
    current_files = [
        p for p in docs.rglob("*") if p.is_file() and "previous-docs" not in p.parts
    ]
    historical_files = [p for p in (docs / "previous-docs").rglob("*") if p.is_file()]
    markdown = [p for p in current_files if p.suffix == ".md"]
    ids: dict[str, Path] = {}
    text_cache: dict[Path, str] = {}
    anchor_cache: dict[Path, set[str]] = {}

    for path in markdown:
        text = path.read_text(encoding="utf-8")
        text_cache[path] = text
        meta = front_matter(text)
        rel = path.relative_to(root).as_posix()
        if meta is None:
            fail(errors, "P1-METADATA", rel, "missing or malformed front matter")
            continue
        for field in (
            "id",
            "title",
            "status",
            "authority",
            "owner",
            "created",
            "last-reviewed",
        ):
            if not meta.get(field):
                fail(errors, "P1-METADATA", rel, f"missing {field}")
        doc_id = meta.get("id", "")
        placeholder_id = doc_id.startswith(('"[', "'[", "["))
        if doc_id and not placeholder_id and not ID_RE.match(doc_id):
            fail(errors, "P1-ID", rel, f"invalid identifier {doc_id!r}")
        if doc_id in ids:
            fail(
                errors,
                "P1-ID-DUPLICATE",
                rel,
                f"duplicate {doc_id} also in {ids[doc_id].relative_to(root)}",
            )
        elif doc_id:
            ids[doc_id] = path

    for path, text in text_cache.items():
        for target in LINK_RE.findall(text):
            target = target.strip().split()[0].strip("<>")
            if not target or target.startswith(("http://", "https://", "mailto:")):
                continue
            file_part, _, fragment = target.partition("#")
            candidate = (
                path if not file_part else (path.parent / unquote(file_part)).resolve()
            )
            try:
                candidate.relative_to(root.resolve())
            except ValueError:
                fail(
                    errors, "P1-LINK-ESCAPE", path.relative_to(root).as_posix(), target
                )
                continue
            if not candidate.exists():
                fail(errors, "P1-LINK-DEAD", path.relative_to(root).as_posix(), target)
                continue
            if fragment and candidate.suffix == ".md":
                if candidate not in anchor_cache:
                    anchor_cache[candidate] = anchors(
                        candidate.read_text(encoding="utf-8")
                    )
                if unquote(fragment).lower() not in anchor_cache[candidate]:
                    fail(
                        errors,
                        "P1-ANCHOR-DEAD",
                        path.relative_to(root).as_posix(),
                        target,
                    )

    ledger = (docs / "18-assurance-audits/historical-findings-ledger.md").read_text(
        encoding="utf-8"
    )
    for number in range(1, 85):
        finding = f"REV-{number:03d}"
        if finding not in ledger:
            fail(
                errors,
                "P1-HISTORICAL-DISPOSITION",
                finding,
                "missing from current ledger",
            )

    baseline = json.loads(
        (root / ".github/policy/p1-baseline.json").read_text(encoding="utf-8")
    )
    expected = {
        "currentDocumentFiles": len(current_files),
        "currentMarkdownFiles": len(markdown),
        "historicalFiles": len(historical_files),
        "historicalAggregateSha256": aggregate(historical_files, root),
    }
    # The current-doc aggregate describes the intake before P1 evidence files;
    # its exact value is retained, while live counts detect accidental omission.
    for key, actual in expected.items():
        if baseline.get(key) != actual:
            fail(
                errors,
                "P1-INVENTORY",
                key,
                f"expected {baseline.get(key)!r}, observed {actual!r}",
            )

    desired = json.loads(
        (root / ".github/policy/github-desired-state.json").read_text(encoding="utf-8")
    )
    if desired["mainRuleset"]["bypassActors"] or desired["tagRuleset"]["bypassActors"]:
        fail(
            errors,
            "P1-BYPASS",
            "github desired state",
            "bypass actor list must be empty",
        )
    if desired["mainRuleset"]["requiredApprovals"] != 0:
        fail(
            errors,
            "P1-REVIEWS",
            "github desired state",
            "required approvals must be zero",
        )

    workflow_path = root / ".github/workflows/required.yml"
    workflow = (
        workflow_path.read_text(encoding="utf-8") if workflow_path.exists() else ""
    )
    if "pull_request_target" in workflow or "workflow_dispatch" in workflow:
        fail(
            errors,
            "P2-WORKFLOW-EVENT",
            "required.yml",
            "privileged/manual required-check events are forbidden",
        )
    if not re.search(r"(?m)^\s{2}pull_request:\s*$", workflow) or not re.search(
        r"(?m)^\s{2}push:\s*$", workflow
    ):
        fail(
            errors,
            "P2-WORKFLOW-EVENT",
            "required.yml",
            "pull_request and protected-main push are required",
        )
    if not re.search(r"(?m)^permissions:\s*\{\}\s*$", workflow):
        fail(
            errors,
            "P2-WORKFLOW-PERMISSIONS",
            "required.yml",
            "top-level permissions must be empty",
        )
    for match in SHA_ACTION_RE.finditer(workflow):
        ref = match.group(1)
        if not ref.startswith("./") and not re.search(r"@[0-9a-f]{40}$", ref):
            fail(errors, "P2-ACTION-PIN", "required.yml", f"non-full-SHA action {ref}")

    return errors


def self_test() -> None:
    assert front_matter("---\nid: GOV-001\ntitle: x\n---\n") == {
        "id": "GOV-001",
        "title": "x",
    }
    assert front_matter("id: GOV-001") is None
    assert slug("Exact `SHA` / DCO") == "exact-sha-dco"
    assert "section" in anchors("# Title\n## Section\n")
    assert PRIVATE_RE.search("-----BEGIN OPEN" + "SSH PRIVATE KEY-----")
    assert not PRIVATE_RE.search("ssh-ed25519 AAAA public")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
    errors = validate(args.root.resolve())
    report = {
        "schemaVersion": 1,
        "subject": str(args.root.resolve()),
        "status": "passed" if not errors else "failed",
        "errors": errors,
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
