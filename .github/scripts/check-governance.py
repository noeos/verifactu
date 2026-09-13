#!/usr/bin/env python3
"""Dependency-free P1 governance and documentation validator."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import sys
import tempfile
from pathlib import Path
from urllib.parse import unquote


ID_RE = re.compile(r"^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SHA_RE = re.compile(r"^[0-9a-f]{40}$")
LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
USES_RE = re.compile(r"^\s*uses:\s*([^\s#]+)", re.MULTILINE)
ALLOWED_KEYS = {
    "id", "title", "status", "authority", "owner", "created",
    "last-reviewed", "review-by", "starts", "expires", "subject-sha",
    "supersedes", "sources", "decisions", "requirements", "tests", "risks",
    "controls", "dependencies", "historical-inputs",
}
LIST_KEYS = {
    "supersedes", "sources", "decisions", "requirements", "tests", "risks",
    "controls", "dependencies", "historical-inputs",
}
STATUSES = {
    "proposed", "researching", "draft", "under-review", "approved", "blocked",
    "superseded", "retired", "historical-input", "open", "closed", "accepted",
    "rejected",
}
AUTHORITIES = {
    "normative", "decision", "evidence", "informative", "historical-input",
    "generated",
}
REQUIRED_CONTEXTS = {
    "Required · governance signatures and DCO",
    "Required · documentation and traceability",
    "Required · required-check closure",
}


class PolicyError(Exception):
    pass


def scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def parse_inline_list(value: str, path: Path, key: str) -> list[str]:
    value = value.strip()
    if not (value.startswith("[") and value.endswith("]")):
        raise PolicyError(f"{path}: {key} must be an inline list")
    inner = value[1:-1].strip()
    if not inner:
        return []
    items = [scalar(item) for item in inner.split(",")]
    if any(not item for item in items):
        raise PolicyError(f"{path}: {key} contains an empty item")
    if len(items) != len(set(items)):
        raise PolicyError(f"{path}: {key} contains a duplicate item")
    return items


def parse_frontmatter(path: Path, text: str) -> dict[str, object]:
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        raise PolicyError(f"{path}: missing opening front matter delimiter")
    try:
        end = lines.index("---", 1)
    except ValueError as exc:
        raise PolicyError(f"{path}: missing closing front matter delimiter") from exc
    result: dict[str, object] = {}
    for number, line in enumerate(lines[1:end], 2):
        if not line or line.lstrip().startswith("#"):
            continue
        if ":" not in line or line[:1].isspace():
            raise PolicyError(f"{path}:{number}: unsupported front matter syntax")
        key, raw = line.split(":", 1)
        if key in result:
            raise PolicyError(f"{path}:{number}: duplicate metadata key {key}")
        if key not in ALLOWED_KEYS:
            raise PolicyError(f"{path}:{number}: unknown metadata key {key}")
        result[key] = parse_inline_list(raw, path, key) if key in LIST_KEYS else scalar(raw)
    return result


def github_heading_anchors(text: str) -> set[str]:
    anchors = set(re.findall(r'<a\s+id=["\']([^"\']+)["\']', text, re.IGNORECASE))
    seen: dict[str, int] = {}
    for line in text.splitlines():
        match = re.match(r"^#{1,6}\s+(.+?)\s*#*\s*$", line)
        if not match:
            continue
        heading = re.sub(r"<[^>]+>", "", match.group(1)).strip().lower()
        heading = re.sub(r"[^\w\- ]", "", heading, flags=re.UNICODE)
        slug = re.sub(r"\s+", "-", heading)
        occurrence = seen.get(slug, 0)
        seen[slug] = occurrence + 1
        anchors.add(slug if occurrence == 0 else f"{slug}-{occurrence}")
    return anchors


def validate_link(root: Path, source: Path, target: str) -> None:
    target = target.strip()
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1]
    if not target or re.match(r"^(?:https?://|mailto:|data:)", target):
        return
    if any(marker in target for marker in ("[", "]", "YYYY", "NNNN")):
        return
    path_part, separator, fragment = target.partition("#")
    destination = source if not path_part else (source.parent / unquote(path_part)).resolve()
    try:
        destination.relative_to(root.resolve())
    except ValueError as exc:
        raise PolicyError(f"{source}: link escapes repository: {target}") from exc
    if not destination.exists():
        raise PolicyError(f"{source}: broken link: {target}")
    if fragment and destination.is_file() and destination.suffix.lower() == ".md":
        anchors = github_heading_anchors(destination.read_text(encoding="utf-8"))
        if unquote(fragment).lower() not in anchors:
            raise PolicyError(f"{source}: unknown anchor: {target}")


def validate_documents(root: Path) -> tuple[int, str]:
    docs_root = root / "docs"
    if not docs_root.is_dir():
        raise PolicyError("docs directory is missing")
    documents = sorted(
        path for path in docs_root.rglob("*.md")
        if "previous-docs" not in path.relative_to(docs_root).parts
    )
    if not documents:
        raise PolicyError("no current documentation discovered")
    ids: dict[str, Path] = {}
    dependencies: list[tuple[Path, str]] = []
    inventory = hashlib.sha256()
    for path in documents:
        relative = path.relative_to(root).as_posix()
        data = path.read_bytes()
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise PolicyError(f"{path}: documentation is not UTF-8") from exc
        if "\r" in text:
            raise PolicyError(f"{path}: CR characters are forbidden")
        inventory.update(relative.encode("utf-8") + b"\0")
        inventory.update(str(len(data)).encode("ascii") + b"\0")
        inventory.update(hashlib.sha256(data).hexdigest().encode("ascii") + b"\n")
        metadata = parse_frontmatter(path, text)
        required = {"id", "title", "status", "authority", "owner", "created", "last-reviewed"}
        missing = sorted(required - metadata.keys())
        if missing:
            raise PolicyError(f"{path}: missing metadata: {', '.join(missing)}")
        is_template = "templates" in path.relative_to(docs_root).parts and path.name != "README.md"
        document_id = str(metadata["id"])
        if not is_template:
            if not ID_RE.fullmatch(document_id):
                raise PolicyError(f"{path}: invalid document id {document_id!r}")
            if document_id in ids:
                raise PolicyError(f"duplicate document id {document_id}: {ids[document_id]} and {path}")
            ids[document_id] = path
        if metadata["status"] not in STATUSES:
            raise PolicyError(f"{path}: invalid status {metadata['status']!r}")
        if metadata["authority"] not in AUTHORITIES:
            raise PolicyError(f"{path}: invalid authority {metadata['authority']!r}")
        for key in ("created", "last-reviewed", "review-by"):
            if key in metadata and not is_template and not DATE_RE.fullmatch(str(metadata[key])):
                raise PolicyError(f"{path}: invalid {key} date")
        if "subject-sha" in metadata and not is_template and not SHA_RE.fullmatch(str(metadata["subject-sha"])):
            raise PolicyError(f"{path}: invalid subject-sha")
        if not re.search(r"^#\s+\S", text, re.MULTILINE):
            raise PolicyError(f"{path}: missing level-one heading")
        if metadata["status"] == "approved" and re.search(r"(?<!`)\b(?:TODO|TBD|FIXME)\b(?!`)", text):
            raise PolicyError(f"{path}: approved document contains a placeholder")
        for dependency in metadata.get("dependencies", []):
            dependencies.append((path, dependency))
        if not is_template:
            for target in LINK_RE.findall(text):
                validate_link(root, path, target)
    for path, dependency in dependencies:
        if dependency not in ids:
            raise PolicyError(f"{path}: unknown document dependency {dependency}")
    return len(documents), inventory.hexdigest()


def archive_identity(root: Path, archive_root: str) -> tuple[int, str]:
    base = root / archive_root
    files = sorted(path for path in base.rglob("*") if path.is_file())
    digest = hashlib.sha256()
    for path in files:
        data = path.read_bytes()
        relative = path.relative_to(root).as_posix()
        digest.update(relative.encode("utf-8") + b"\0")
        digest.update(str(len(data)).encode("ascii") + b"\0")
        digest.update(hashlib.sha256(data).hexdigest().encode("ascii") + b"\n")
    return len(files), digest.hexdigest()


def validate_archive(root: Path) -> tuple[int, str]:
    policy_path = root / ".github/policy/previous-docs-archive.json"
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    if policy.get("schemaVersion") != 1 or policy.get("root") != "docs/previous-docs":
        raise PolicyError("unsupported previous-docs archive policy")
    observed = archive_identity(root, policy["root"])
    expected = (policy.get("fileCount"), policy.get("aggregateSha256"))
    if observed != expected:
        raise PolicyError(f"historical archive drift: expected {expected}, observed {observed}")
    return observed


def validate_allowed_signers(root: Path) -> str:
    path = root / ".github/policy/allowed-signers"
    lines = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    if len(lines) != 1:
        raise PolicyError("P1 allowed-signers must contain exactly one active signer")
    if "PRIVATE" in lines[0] or "namespaces=\"git\"" not in lines[0]:
        raise PolicyError("allowed-signers exposes private material or lacks git namespace")
    parts = lines[0].split()
    if len(parts) < 4 or parts[0] != "ddcandales@gmail.com" or parts[2] != "ssh-ed25519":
        raise PolicyError("allowed-signers does not bind the canonical identity and key type")
    try:
        decoded = base64.b64decode(parts[3], validate=True)
    except ValueError as exc:
        raise PolicyError("allowed-signers public key is not valid base64") from exc
    if len(decoded) < 32:
        raise PolicyError("allowed-signers public key is unexpectedly short")
    return hashlib.sha256(decoded).hexdigest()


def validate_workflow_text(path: Path, text: str) -> set[str]:
    if "pull_request_target:" in text or "workflow_run:" in text:
        raise PolicyError(f"{path}: privileged event is forbidden in P1")
    if not re.search(r"^permissions:\s*\{\}\s*$", text, re.MULTILINE):
        raise PolicyError(f"{path}: top-level permissions must be empty")
    if re.search(r"\b(?:id-token|attestations|packages|deployments|security-events):\s*write\b", text):
        raise PolicyError(f"{path}: privileged write permission is forbidden in P1")
    for used in USES_RE.findall(text):
        if used.startswith("./"):
            continue
        if "@" not in used or not SHA_RE.fullmatch(used.rsplit("@", 1)[1]):
            raise PolicyError(f"{path}: Action is not pinned to a full SHA: {used}")
    if not re.search(r"^  pull_request:\s*$", text, re.MULTILINE):
        raise PolicyError(f"{path}: pull_request trigger is required")
    main_push = re.search(
        r"^  push:\s*\n    branches:\s*\n      - main\s*$",
        text,
        re.MULTILINE,
    )
    if not main_push or re.search(r"^      - [\"']?\*", text, re.MULTILINE):
        raise PolicyError(f"{path}: push trigger must target only main")
    names = set(re.findall(r"^\s{4}name:\s*(Required · .+?)\s*$", text, re.MULTILINE))
    return names


def validate_workflows(root: Path) -> None:
    paths = sorted((root / ".github/workflows").glob("*.yml"))
    if paths != [root / ".github/workflows/governance.yml"]:
        raise PolicyError("P1 must contain exactly the governance workflow")
    observed: set[str] = set()
    for path in paths:
        observed |= validate_workflow_text(path, path.read_text(encoding="utf-8"))
    if observed != REQUIRED_CONTEXTS:
        raise PolicyError(f"required context drift: expected {sorted(REQUIRED_CONTEXTS)}, observed {sorted(observed)}")


def validate_github_policy(root: Path) -> None:
    policy = json.loads((root / ".github/policy/github.json").read_text(encoding="utf-8"))
    if policy.get("schemaVersion") != 1 or policy.get("repository") != "noeos/verifactu":
        raise PolicyError("invalid GitHub policy identity")
    if policy["actions"] != {
        "enabled": True,
        "allowedActions": "selected",
        "githubOwnedAllowed": True,
        "verifiedAllowed": False,
        "patternsAllowed": [],
        "shaPinningRequired": True,
        "defaultWorkflowPermissions": "read",
        "canApprovePullRequestReviews": False,
    }:
        raise PolicyError("GitHub Actions policy is not the P1 least-privilege state")
    main = policy["mainRuleset"]
    if main["bypassActors"] or main["include"] != ["refs/heads/main"] or main["exclude"]:
        raise PolicyError("main ruleset target or bypass policy is unsafe")
    pr = main["rules"]["pullRequest"]
    if pr["requiredApprovingReviewCount"] != 0 or pr["requireCodeOwnerReview"] or pr["requireLastPushApproval"] or pr["requireExtraApprovalForUnattributedChanges"]:
        raise PolicyError("main ruleset contains fictional reviewer requirements")
    if set(main["rules"]["requiredStatusChecks"]["contexts"]) != REQUIRED_CONTEXTS:
        raise PolicyError("main ruleset required contexts differ from workflow contract")
    tag = policy["tagRuleset"]
    if tag["bypassActors"] or tag["include"] != ["refs/tags/v*"] or tag["exclude"]:
        raise PolicyError("tag ruleset target or bypass policy is unsafe")


def validate_repo(root: Path) -> dict[str, object]:
    root = root.resolve()
    for forbidden in (root / "packages", root / "src"):
        if forbidden.exists():
            raise PolicyError(f"product source is forbidden during P1: {forbidden.relative_to(root)}")
    codeowners = [path for path in root.rglob("CODEOWNERS") if "previous-docs" not in path.parts and ".git" not in path.parts]
    if codeowners:
        raise PolicyError(f"CODEOWNERS is forbidden: {codeowners}")
    doc_count, doc_digest = validate_documents(root)
    archive_count, archive_digest = validate_archive(root)
    signer_material_digest = validate_allowed_signers(root)
    validate_workflows(root)
    validate_github_policy(root)
    return {
        "schemaVersion": 1,
        "result": "passed",
        "currentDocumentationFiles": doc_count,
        "currentDocumentationAggregateSha256": doc_digest,
        "historicalArchiveFiles": archive_count,
        "historicalArchiveAggregateSha256": archive_digest,
        "allowedSignerPublicMaterialSha256": signer_material_digest,
        "requiredContexts": sorted(REQUIRED_CONTEXTS),
        "productSourcePresent": False,
        "codeownersPresent": False,
    }


def self_test() -> dict[str, object]:
    tests: list[str] = []

    def expect_failure(name: str, function, contains: str) -> None:
        try:
            function()
        except (PolicyError, json.JSONDecodeError) as exc:
            if contains not in str(exc):
                raise PolicyError(f"self-test {name} failed for wrong reason: {exc}") from exc
            tests.append(name)
            return
        raise PolicyError(f"self-test {name} unexpectedly passed")

    expect_failure(
        "mutable-action-reference",
        lambda: validate_workflow_text(Path("fixture.yml"), "permissions: {}\n    uses: actions/checkout@v7\n"),
        "full SHA",
    )
    expect_failure(
        "privileged-event",
        lambda: validate_workflow_text(Path("fixture.yml"), "permissions: {}\npull_request_target:\n"),
        "privileged event",
    )
    expect_failure(
        "branch-push-context-duplication",
        lambda: validate_workflow_text(
            Path("fixture.yml"),
            "permissions: {}\n  pull_request:\n  push:\n    branches:\n      - \"**\"\n",
        ),
        "push trigger must target only main",
    )
    with tempfile.TemporaryDirectory(prefix="verifactu-governance-") as directory:
        root = Path(directory)
        (root / "docs").mkdir()
        first = root / "docs/first.md"
        second = root / "docs/second.md"
        first.write_text(
            "---\nid: FIX-DOC-0001\ntitle: First\nstatus: draft\nauthority: normative\n"
            "owner: test\ncreated: 2026-01-01\nlast-reviewed: 2026-01-01\n"
            "dependencies: [FIX-DOC-0002]\n---\n# First\n[second](second.md)\n",
            encoding="utf-8",
        )
        second.write_text(
            "---\nid: FIX-DOC-0002\ntitle: Second\nstatus: draft\nauthority: normative\n"
            "owner: test\ncreated: 2026-01-01\nlast-reviewed: 2026-01-01\n---\n# Second\n",
            encoding="utf-8",
        )
        validate_documents(root)
        tests.append("valid-document-graph")
        second.write_text(second.read_text(encoding="utf-8").replace("FIX-DOC-0002", "FIX-DOC-0001"), encoding="utf-8")
        expect_failure("duplicate-document-id", lambda: validate_documents(root), "duplicate document id")
        second.write_text(second.read_text(encoding="utf-8").replace("FIX-DOC-0001", "FIX-DOC-0002"), encoding="utf-8")
        first.write_text(first.read_text(encoding="utf-8").replace("second.md", "missing.md"), encoding="utf-8")
        expect_failure("broken-internal-link", lambda: validate_documents(root), "broken link")
        first.write_text(first.read_text(encoding="utf-8").replace("[second](missing.md)", "[second](second.md)"), encoding="utf-8")
        second.write_text(second.read_text(encoding="utf-8").replace("id: FIX-DOC-0002\n", ""), encoding="utf-8")
        expect_failure("missing-required-metadata", lambda: validate_documents(root), "missing metadata")

    return {"schemaVersion": 1, "result": "passed", "negativeFixtures": tests}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    try:
        result = self_test() if args.self_test else validate_repo(args.root)
    except (PolicyError, OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"schemaVersion": 1, "result": "failed", "diagnostic": str(exc)}, ensure_ascii=False, sort_keys=True))
        return 1
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
