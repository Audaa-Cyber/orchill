# MVP scope and acceptance checklist

## Included in this MVP

- [x] Versioned JSON registry with a documented JSON Schema.
- [x] List categories, list a category's skills, and list the full catalogue.
- [x] Inspect skill and category metadata before installation.
- [x] Install one skill, one category, or the entire eligible catalogue.
- [x] Preserve complete category/skill folders and nested files.
- [x] Local directory and HTTPS Git sources.
- [x] Sparse checkout for Git-backed skills.
- [x] Explicit project/agents, Claude, and Codex installation targets.
- [x] Dry-run for installation and update/removal planning.
- [x] Existing-install conflict handling and explicit force replacement.
- [x] Update, remove, and check installed content.
- [x] Project initialization with safe, idempotent agent-instruction setup.
- [x] Import of supported skill command lists for review.
- [x] Basic registry/path validation and symlink defenses.
- [x] Tests and GitHub Actions CI.
- [x] Provenance and licensing review workflows.

## Not in this MVP

- [ ] Natural-language auto-selection and unattended installation.
- [ ] Registry hosting, signing, source attestations, or immutable lockfile.
- [ ] GUI or interactive TUI.
- [ ] Full malware, prompt-injection, or instruction audit.
- [ ] Public npm publication, until the release gate and CI pass.

## Canonical public CLI

The public interface is intentionally limited to these commands:

```sh
orchill list
orchill list <category>
orchill list --all
orchill info <name>
orchill add <skill>
orchill add <category>
orchill add catalogue
orchill update
orchill remove <name>
orchill check
orchill check <name>
orchill init
orchill import <file>
orchill --help
orchill --version
```

Run `orchill init` once in each project to create `.agents/skills/` and add a managed discovery section to `AGENTS.md`. It preserves existing instructions and does not install skills. Run `orchill add` afterward to install selected content.

## Acceptance checks before calling the MVP verified

1. Latest GitHub Actions run passes all steps.
2. A fresh checkout can install dependencies, typecheck, test, build, and run CLI commands.
3. `orchill init` creates the skill directory and is safe to rerun.
4. Existing `AGENTS.md` content is preserved during initialization.
5. Installing a skill preserves `SKILL.md` and nested files.
6. An existing install is not replaced without force.
7. A failed staged replacement does not lose the previous installation.
8. Git sparse checkout installs only the selected skill folder and its nested contents.
9. Category and catalogue installs preserve folder hierarchy and require confirmation unless `--yes` is provided.
10. Registry paths, invalid IDs, non-HTTPS Git URLs, and symlink destinations fail safely.
11. Documentation accurately describes the public CLI and the actual integration behavior.
