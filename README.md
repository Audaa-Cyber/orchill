# Orchill

**Find the skill you need. Install only that skill. Keep its whole folder.**

Orchill is a CLI-first skill manager for AI-agent workflows. It searches a versioned JSON registry, filters by category, and installs a selected skill's complete directory tree into an explicit target. It does not download every skill in a collection just to find one.

> **Catalog status:** the registry currently contains 221 skills across 20 categories, including the earlier curated entries and locally staged imports. Local skill payloads are organized under `skills/<category-slug>/<skill-id>/` and bundled for offline installation from this checkout/package. Imported sources have mixed verification status: many do not yet have an immutable upstream revision or verified license recorded. Treat all third-party skill instructions and scripts as untrusted; review provenance, license, and content before publishing or using them. CI is configured to verify build, tests, catalogue generation, package installation, and category installation. See [MVP readiness and release blockers](docs/MVP-READINESS.md) before distributing the bundled catalogue.

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

For local development: `npm run dev -- search focus`.

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
node dist/cli.js categories
node dist/cli.js search demo
node dist/cli.js info demo-focus
node dist/cli.js install demo-focus --dry-run
node dist/cli.js install demo-focus
```

The default project target is `.agents/skills/<skill-id>/`. Other supported targets:

| Target | Destination relative to project |
|---|---|
| `project` | `.agents/skills/` |
| `agents` | `.agents/skills/` |
| `claude` | `.claude/skills/` |
| `codex` | `.agents/skills/` (Codex project skills) |

Use `--cwd /path/to/project` to select a destination project. Use `--force` to replace an existing installation. Review the displayed destination before installing.

## Commands

- `orchill search <query>` — search ID, name, description, category, and tags.
- `orchill list [--category <name>]` — list catalog entries.
- `orchill categories` — show categories and counts.
- `orchill info <id>` — inspect metadata and provenance notes.
- `orchill audit [--json] [--strict]` — review missing metadata, invalid local skill paths, and heuristic security flags.
- `orchill install <id> [--target project|agents|claude|codex]` — install one skill.
- `orchill install <id> --dry-run` — preview a single install.
- `orchill install-category <category>` — show a plan, then ask for confirmation; use `--yes` in reviewed automation.
- `orchill targets` — show destinations.
- `orchill registry` — show active registry.
- `orchill init` — create a project-local empty registry template.

Most commands accept `--registry /path/to/skills.json`.

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
- MVP currently has no update/uninstall/lockfile, dependency resolution, remote hosted catalog, MCP server, or built-in agent auto-detection.
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
