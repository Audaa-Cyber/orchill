# MVP scope and acceptance checklist

## Included in this MVP

- [x] Versioned JSON registry with a documented JSON Schema.
- [x] Search by ID, name, description, category, and tags.
- [x] List all skills and filter by category.
- [x] Inspect skill metadata before installation.
- [x] Install a single selected skill.
- [x] Install one category after displaying the plan and requesting confirmation.
- [x] Preserve nested files and directories.
- [x] Local directory and HTTPS Git sources.
- [x] Sparse checkout for Git-backed skills.
- [x] Explicit targets for project/agents, Claude, and Codex.
- [x] Dry-run for a single skill.
- [x] Existing-install conflict handling and explicit force replacement.
- [x] Basic registry/path validation and symlink defenses.
- [x] Tests and GitHub Actions CI.
- [x] Example skill and a small initial catalog.

## Not in this MVP

- [ ] MCP server / hosted agent integration.
- [ ] Natural-language auto-selection and unattended installation.
- [ ] Registry hosting, signing, source attestations, or immutable lockfile.
- [ ] Update, uninstall, dependency graph, conflict resolver, or installed-state database.
- [ ] GUI or interactive TUI.
- [ ] Full malware, prompt-injection, or instruction audit.
- [ ] Public npm publication.

## Acceptance checks before calling the MVP verified

1. Latest GitHub Actions run passes all steps.
2. A fresh checkout can install dependencies, typecheck, test, build, and run CLI commands.
3. Installing demo-focus preserves SKILL.md and nested files.
4. An existing install is not replaced without force.
5. A failed staged replacement does not lose the previous installation.
6. Git sparse checkout installs only the selected skill folder and its nested contents.
7. Category install requires confirmation unless yes is provided.
8. Registry paths, invalid IDs, non-HTTPS Git URLs, and symlink destinations fail safely.
9. Documentation accurately distinguishes the CLI from an MCP integration.
