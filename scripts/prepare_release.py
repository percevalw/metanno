#!/usr/bin/env python3
"""
Prepare a release branch, commit and PR for Metanno.

The script bumps the version in `VERSION_FILES`, renames the `## Unreleased` section
of the changelog to `## v<version> (<date>)` and, with `--commit --push --pr`,
opens a `release/v<version>` PR. The PR body holds the release message between
`RELEASE_MESSAGE_START` and `RELEASE_MESSAGE_END`, which
`.github/workflows/release-from-pr.yml` publishes as a GitHub release once the PR
is merged.

```text
python scripts/prepare_release.py 2.0.0-beta.2   # explicit version
python scripts/prepare_release.py --bump minor   # 2.0.0 -> 2.1.0
python scripts/prepare_release.py 2.0.0 --commit --push --pr
```
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHANGELOG = ROOT / "CHANGELOG.md"
RELEASE_MESSAGE_START = "<!-- release-message:start -->"
RELEASE_MESSAGE_END = "<!-- release-message:end -->"
VERSION = r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?"
# Files holding the package version, the first group of each pattern is the version
# and the first file gives the current version
VERSION_FILES = {
    ROOT / "metanno" / "version.py": r'^__version__ = "([^"]+)"$',
    ROOT / "package.json": r'^  "version": "([^"]+)",$',
    ROOT / "docs" / "installation.md": rf"metanno>=({VERSION})",
}


class ReleaseError(RuntimeError):
    pass


def run(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    """Run a command in the repository and return its captured output"""
    proc = subprocess.run(args, cwd=ROOT, check=False, text=True, capture_output=True)
    if check and proc.returncode != 0:
        raise ReleaseError(
            proc.stderr.strip() or proc.stdout.strip() or f"{args[0]} exited with code {proc.returncode}"
        )
    return proc


def generate_release_notes(tag: str, previous_tag: str | None, target: str) -> str:
    """
    Ask GitHub for the list of PRs merged since `previous_tag`, shown under the
    changelog in the release message. Returns a placeholder when `gh` is missing
    or the call fails, eg when `previous_tag` does not exist.
    """
    placeholder = "## Pull Requests\n\n_To be completed before merge._"
    if shutil.which("gh") is None:
        return placeholder
    origin = run("git", "remote", "get-url", "origin").stdout.strip()
    match = re.search(r"github\.com[:/]([^/]+/[^/.]+?)(?:\.git)?$", origin)
    if match is None:
        raise ReleaseError(f"Could not find the GitHub repository in {origin}")
    command = ["gh", "api", "--method", "POST"]
    command += [f"repos/{match.group(1)}/releases/generate-notes"]
    command += ["-f", f"tag_name={tag}", "-f", f"target_commitish={target}"]
    if previous_tag is not None:
        command += ["-f", f"previous_tag_name={previous_tag}"]
    proc = run(*command, check=False)
    body = json.loads(proc.stdout).get("body", "").strip() if proc.returncode == 0 else ""
    if not body:
        return placeholder
    return re.sub(r"^## What's Changed$", "## Pull Requests", body, count=1, flags=re.M)


def create_or_update_pr(branch: str, base: str, title: str, body: str) -> None:
    """Open the release PR from `branch` to `base`, or update the open one"""
    if shutil.which("gh") is None:
        raise ReleaseError("gh CLI is required to create or update the PR")
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as handle:
        handle.write(body)
    body_file = Path(handle.name)
    try:
        open_prs = json.loads(
            run(
                "gh",
                "pr",
                "list",
                "--head",
                branch,
                "--base",
                base,
                "--state",
                "open",
                "--limit",
                "1",
                "--json",
                "number",
            ).stdout
        )
        if open_prs:
            number = str(open_prs[0]["number"])
            run("gh", "pr", "edit", number, "--title", title, "--body-file", str(body_file))
        else:
            run(
                "gh",
                "pr",
                "create",
                "--base",
                base,
                "--head",
                branch,
                "--title",
                title,
                "--body-file",
                str(body_file),
            )
    finally:
        body_file.unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("version", nargs="?", help="Target version, eg 2.0.0-beta.2")
    parser.add_argument(
        "--bump",
        choices=["major", "minor", "patch"],
        help="Compute the target version from the current one",
    )
    parser.add_argument("--base", default="main", help="Base branch of the release PR")
    parser.add_argument("--branch", help="Release branch, release/v<version> by default")
    parser.add_argument(
        "--release-date",
        default=dt.date.today().isoformat(),
        help="Date of the changelog heading",
    )
    parser.add_argument("--commit", action="store_true", help="Commit the changes")
    parser.add_argument("--push", action="store_true", help="Push the release branch")
    parser.add_argument("--force", action="store_true", help="Force push the branch")
    parser.add_argument("--pr", action="store_true", help="Create or update the PR")
    parser.add_argument(
        "--allow-dirty",
        action="store_true",
        help="Allow tracked local changes before preparing the release",
    )
    args = parser.parse_args(argv)

    first_file, first_pattern = next(iter(VERSION_FILES.items()))
    current = re.search(first_pattern, first_file.read_text(), re.M).group(1)
    if bool(args.version) == bool(args.bump):
        raise ReleaseError("Pass either a target version or --bump")
    if args.version and not re.fullmatch(VERSION, args.version):
        raise ReleaseError(f"Invalid version {args.version}, expected eg 2.0.0-beta.2")
    if args.bump and "-" in current:
        raise ReleaseError(f"{current} is a pre-release, pass the target version explicitly")
    if args.push and not args.commit:
        raise ReleaseError("Use --push together with --commit")
    if args.pr and not args.push:
        raise ReleaseError("Use --pr together with --push")
    if run("git", "status", "--porcelain", "--untracked-files=no").stdout.strip():
        if not args.allow_dirty:
            raise ReleaseError(
                "Tracked local changes detected, commit or stash them first, or rerun with --allow-dirty"
            )

    if args.version:
        version = args.version
    else:
        major, minor, patch = [int(part) for part in current.split(".")]
        version = {
            "major": f"{major + 1}.0.0",
            "minor": f"{major}.{minor + 1}.0",
            "patch": f"{major}.{minor}.{patch + 1}",
        }[args.bump]
    if version == current:
        raise ReleaseError(f"The repository is already on version {version}")
    tag = f"v{version}"
    branch = args.branch or f"release/{tag}"

    changelog = CHANGELOG.read_text()
    if re.search(rf"^## {re.escape(tag)}(?:\s|$)", changelog, re.M):
        raise ReleaseError(f"{CHANGELOG.name} already contains a {tag} section")
    # The first released section of the changelog gives the tag that generated notes start from
    previous = re.search(rf"^## v({VERSION}) \(\d{{4}}-\d{{2}}-\d{{2}}\)$", changelog, re.M)
    previous_tag = None if previous is None else f"v{previous.group(1)}"

    # New contents of the version files and of the changelog, written once all of them are valid
    updates = {}
    for path, pattern in VERSION_FILES.items():
        text = path.read_text()
        updates[path] = re.sub(pattern, lambda m: m.group(0).replace(m.group(1), version), text, flags=re.M)
        if updates[path] == text:
            raise ReleaseError(f"Could not find the version in {path.relative_to(ROOT)}")
    heading = f"## {tag} ({args.release_date})"
    updates[CHANGELOG] = re.sub(r"^## Unreleased$", heading, changelog, count=1, flags=re.M)
    if heading not in updates[CHANGELOG]:
        raise ReleaseError(f"Could not find '## Unreleased' in {CHANGELOG.name}")
    # Section of the released version, up to the next version heading
    changelog_body = re.search(rf"^{re.escape(heading)}\n(.*?)(?=^## |\Z)", updates[CHANGELOG], re.M | re.S).group(1)

    # The release branch always starts from the current commit, replacing a local branch left by an earlier run
    run("git", "switch", "-C", branch)
    for path, text in updates.items():
        path.write_text(text)

    touched = [str(path.relative_to(ROOT)) for path in [*VERSION_FILES, CHANGELOG]]
    if args.commit:
        run("git", "add", "--", *touched)
        run("git", "commit", "-m", f"chore: bump version to {version}")
    if args.push:
        run("git", "push", "-u", "origin", branch, *(["--force"] if args.force else []))

    notes = generate_release_notes(tag, previous_tag, branch if args.push else args.base)
    release_message = "\n".join(
        [
            "<!-- Edit the release message between the markers before merging this PR. -->",
            RELEASE_MESSAGE_START,
            "## Changelog",
            "",
            changelog_body.strip(),
            "",
            notes.strip(),
            RELEASE_MESSAGE_END,
            "",
        ]
    )
    if args.pr:
        title = f"chore: bump version to {version}"
        create_or_update_pr(branch, args.base, title, release_message)

    print(f"Prepared release {tag} on branch {branch}")
    print("Touched files:\n" + "\n".join(f"- {path}" for path in touched))
    if not args.pr:
        print("\nRelease message:\n" + release_message)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ReleaseError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
