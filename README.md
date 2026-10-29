# Orchill

**Discover it. Add a skill, a category, or the whole catalogue. Keep the complete folder structure.**

Orchill is a CLI-first skill manager for AI-agent workflows. Humans and agents use the same short commands to list categories and skills, inspect metadata, install a skill/category/catalogue, update installations, remove them, and check integrity. Installation preserves the complete category/skill directory tree.

> **Catalog status:** the registry contains 201 skills across 19 categories, all with evidence-backed upstream provenance: every bundled payload is byte-identical (normalized SHA-256) to its upstream source at a pinned revision, with the actual upstream license file captured in `provenance/licenses/` and a redistribution approval recorded in `registry/release-approvals.json`. 20 third-party payloads whose upstream license evidence does not grant redistribution (proprietary, service-terms-only, or license-free upstreams) are quarantined in `third-party-review/` with reasons recorded in `registry/excluded-payloads.json` and are **not** shipped in the npm package. Local skill payloads are organized under `skills/<category-slug>/<skill-id>/` and bundled for offline installation from this checkout/package. Treat third-party skill instructions and scripts as untrusted; see [MVP readiness and release blockers](docs/MVP-READINESS.md). `npm publish` is gated on the strict release check (`npm run release:check -- --strict`), which verifies every bundled skill has a complete evidence-backed approval.

## Requirements

- Node.js 22 or newer
- Git installed for Git-backed sources

## Install from a checkout

```sh
git clone https://github.com/Audaa-Cyber/orchill.git
cd orchill
npm install
npm run build
node dist/cli.js --help
```

For local development: `npm run dev -- list --all`.

To install the checked-out version as a global CLI on your own machine (without publishing to npm):

```sh
npm install
npm run build
npm install --global .
orchill --help
```

To update that local global install after pulling changes, rerun `npm run build` and `npm install --global .` from the repository root. This is a local source install, not an npm registry release.

## Quick start

```sh
orchill list
orchill list "UI/UX Design"
orchill info demo-focus
orchill add demo-focus
orchill add "UI/UX Design"
orchill add catalogue
orchill check
```

The default project target is `.agents/skills/<category>/<skill>/`. Every installed skill keeps its complete nested files, including `SKILL.md`, references, scripts, examples, and assets.

| Target | Destination relative to project |
|---|---|
| `project` | `.agents/skills/<category>/<skill>/` |
| `agents` | `.agents/skills/<category>/<skill>/` |
| `claude` | `.claude/skills/<category>/<skill>/` |
| `codex` | `.agents/skills/<category>/<skill>/` |

Use `--cwd /path/to/project` to select a destination project. Use `--force` to replace an existing Orchill-managed installation. Review the displayed destination before installing.

## Commands

- `orchill list [category]` / `orchill ls [category]` — list categories, or skills inside one category.
- `orchill list --all` — list every skill in every category.
- `orchill info <name>` — inspect a skill or category.
- `orchill add <name>` — install one skill or every skill in a category.
- `orchill add catalogue` — install the entire eligible catalogue with all category and skill folders preserved.
- `orchill update` / `orchill up` — update Orchill-managed installed skills.
- `orchill remove <name>` / `orchill rm <name>` — remove an installed skill, category, or catalogue.
- `orchill check` — verify installed content; use `--json` for automation.
- `orchill audit` — review registry metadata and heuristic findings.
- `orchill init` — create a project-local registry template.
- `orchill import <file>` — stage Skills CLI or marketplace command imports.
- `orchill --help` / `orchill -h` — explain the full interface, structure, targets, agent integration, safety, and automation.
- `orchill --version` / `orchill -V` — show the installed version.

No category gets its own command. The same `list`, `info`, `add`, `update`, `remove`, and `check` commands work for every category and skill.

## Add a Git-backed skill

Add a registry entry only after verifying the upstream repository, exact skill directory, license, and source provenance. Example shape:

```json
{
  "id": "my-skill",
  "name": "My Skill",
  "description": "What it does.",
  "category": "Frontend & React",
  "tags": ["react", "frontend"],
  "source": {
    "type": "git",
    "url": "https://github.com/OWNER/REPOSITORY.git",
    "ref": "v1.2.3"
  },
  "skillPath": "skills/my-skill",
  "license": "MIT",
  "provenance": "Verified upstream repository and commit/tag",
  "targets": ["project", "claude", "codex", "agents"]
}
```

For a Git source, `skillPath` identifies the directory in the source repository. Orchill uses Git sparse checkout to fetch that directory, then copies its nested files. Pin `ref` to a reviewed tag or commit where possible. The source URL currently requires HTTPS. Git-backed installation requires Git.

## Registry

Default registry: `registry/skills.json`. Its format is documented by `registry/skills.schema.json`. You can use a separate registry with `--registry`; `orchill init` creates an empty project-local template. Orchill validates required fields and duplicate IDs at load time.

## Security model and limitations

- Installs are explicit; search and info never install or execute skills.
- Installed scripts are **not** automatically run.
- Skill IDs and relative paths are validated; destination parent symlinks are rejected.
- Existing installs are not overwritten unless `--force` is supplied.
- Category installation prints the complete plan and asks for confirmation unless `--yes` is passed.
- Source/license metadata is only as trustworthy as the registry maintainer. Orchill does not verify signatures or prove that skill instructions are safe. `orchill audit` provides limited heuristic triage only; remote Git source content is not downloaded by the audit.
- Review third-party `SKILL.md` and referenced scripts before allowing an agent to use them.
- Do not treat a URL, repository name, or license field as proof that a source is safe or correctly licensed.
- MCP is available as an agent integration when configured by the host; the npm package does not automatically configure every AI client. Orchill does not execute installed skill scripts.
- This CLI does not make skills automatically available inside hosted ChatGPT or Claude chats. Such environments need a supported local tool, filesystem, or MCP integration.

## Development

```sh
npm run typecheck
npm test
npm run build
```

See [docs/CATALOG.md](./docs/CATALOG.md) for the default catalog and provenance notes, [docs/SECURITY.md](./docs/SECURITY.md) for the trust model, [docs/MVP-SCOPE.md](./docs/MVP-SCOPE.md) for acceptance criteria, and [journal.md](./journal.md) for decisions and progress.

## Bulk-import skills from Skills CLI commands

Create a text file with one command per line. Blank lines and lines beginning with # are ignored.

\`\`\`sh
npx skills add Leonxlnx/taste-skill@design-taste-frontend
npx skills add owner/repo --skill "A skill with spaces"
\`\`\`

Preview the commands first:

\`\`\`sh
orchill import-commands skill-commands.txt --dry-run
\`\`\`

Then stage the skills:

\`\`\`sh
orchill import-commands skill-commands.txt --output .orchill-import --category "UI/UX Design"
\`\`\`

The importer supplies non-interactive upstream CLI flags and uses Codex only as a deterministic staging destination inside a temporary directory. It does not install into your actual project or user profile. It processes commands sequentially, continues after individual failures, rejects unsafe command syntax and symlinks, and produces copied skill folders plus registry-additions.json, report.json, and report.md. The main registry is never changed automatically. Review metadata, source provenance, instructions, referenced scripts, and licensing before publishing; a license file's presence is not proof of permission to redistribute. Use a new output directory for each run.


## Bulk-import agent plugin marketplace commands

The same `orchill import-commands` command also accepts slash-command lists for agent plugin marketplaces. For example, create `marketplace-commands.txt`:

```text
/plugin marketplace add dotnet/skills
/plugin install dotnet-diag@dotnet-agent-skills
/plugin install dotnet-msbuild@dotnet-agent-skills
```

Preview the syntax before downloading:

```sh
orchill import-commands marketplace-commands.txt --dry-run
```

Then stage the selected plugin bundles:

```sh
orchill import-commands marketplace-commands.txt --output .orchill-dotnet-import --category ".NET Development"
```

Orchill clones each registered marketplace repository into a temporary directory, resolves the marketplace's declared name from `.agents/plugins/marketplace.json`, verifies the requested plugin is listed in that manifest, and stages every nested `SKILL.md` directory in that plugin as an individual skill. This imports the plugin's skills, not its full agent-plugin runtime package: plugin-specific agents, hooks, commands, and other non-skill resources are not installed. The generated registry additions and reports are review artifacts; they do not change your agent's global plugin configuration or the canonical Orchill registry. Use the exact marketplace name declared by the repository manifest (for dotnet/skills, `dotnet-agent-skills`). The marketplace source is cloned at its current default branch, not pinned automatically; review and pin provenance before publishing.

**Current limitation:** use one command file per command family. Do not mix `npx skills add` commands and `/plugin` commands in the same file yet. Orchill does not execute imported scripts, and imported instructions, source provenance, and licensing still require review.


## Browse the catalog

- [Human-readable catalog](catalog/CATALOG.md)
- [Category folders](catalog/categories/)
- [Machine-readable category manifest](catalog/categories.json)

The catalogue is generated from `registry/skills.json` with `npm run catalog:generate`.


## License

Orchill's original code and project documentation are licensed under the [Apache License 2.0](./LICENSE). This project license does not automatically relicense bundled third-party skills; each skill's upstream license and redistribution permissions must be checked independently. See [docs/SECURITY.md](./docs/SECURITY.md).


For third-party skill licensing and source provenance review, see [the provenance workflow](docs/PROVENANCE-AND-LICENSE-REVIEW.md).


## Verify and uninstall managed installations

New installations include an Orchill marker. Use `orchill check` to verify installations and `orchill remove <name>` to remove only Orchill-managed content. Removal prompts for confirmation; use `--yes` only after reviewing the destination. Unmanaged directories are deliberately not removed. Verification checks structure and the marker; it is not a cryptographic integrity or malware scan.


## Release review

The full development catalogue and categorized imported payloads are not automatically approved for redistribution. Generate a provenance review queue with `npm run release:review-queue` and follow [the Phase 2 release-review workflow](docs/PHASE-2-RELEASE-REVIEW.md) before publishing bundled third-party skills.
