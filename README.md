# Orchill

**Find and install AI-agent skills without losing their files or folder structure.**

Orchill is a command-line tool that helps you discover, install, update, and manage reusable skills for coding agents. You choose what to install: one skill, a whole category, or the complete approved catalogue.

Skills keep their supporting files, such as instructions, examples, references, and scripts.

## Get started

**You need Node.js 22 or newer.** Git is also needed when installing skills directly from Git repositories.

### 1. Install Orchill

Open a terminal and run:

```sh
npm install --global orchill
```

### 2. Open your project

Change into the folder for the project where you want to use skills:

```sh
cd my-project
```

Replace `my-project` with your actual project folder.

### 3. Set up the project

```sh
orchill init
```

This prepares the project for Orchill and adds instructions to `AGENTS.md` so compatible coding agents can find the skills. It does **not** install skills automatically.

### 4. Find and install a skill

See the available categories:

```sh
orchill list
```

See every available skill:

```sh
orchill list --all
```

Get details about a skill:

```sh
orchill info demo-focus
```

Install a skill:

```sh
orchill add demo-focus
```

You can also install a category or the full approved catalogue:

```sh
orchill add "UI/UX Design"
orchill add catalogue
```

Review the destination shown by Orchill before confirming an installation.

## Everyday commands

| Command | What it does |
| --- | --- |
| `orchill list` | Browse skill categories |
| `orchill list --all` | Show all available skills |
| `orchill info <name>` | Read details about a skill or category |
| `orchill add <name>` | Install a skill or category |
| `orchill add catalogue` | Install the approved catalogue |
| `orchill update` | Update skills managed by Orchill |
| `orchill check` | Check your installed skills |
| `orchill remove <name>` | Remove a skill managed by Orchill |
| `orchill import <file>` | Prepare skills from supported command lists for review |
| `orchill --help` | See all commands and options |
| `orchill --version` | Show the installed version |

## Where do skills go?

By default, project skills are installed in:

```text
.agents/skills/<category>/<skill>/
```

Orchill preserves the skill's nested files instead of copying only its main instruction file. It does not overwrite an existing installation unless you use `--force`.

Use `--cwd /path/to/project` if you want to select a different project folder. Check the displayed destination before confirming.

## Import skills for review

Orchill can prepare skill folders from supported Skills CLI command lists and agent-plugin marketplace command lists.

For example, create a text file containing one command per line, then preview it without downloading anything:

```sh
orchill import skill-commands.txt --dry-run
```

To stage the imported files for review:

```sh
orchill import skill-commands.txt --output .orchill-import --category "UI/UX Design"
```

Imports are staged for review; they do not automatically change Orchill's main catalogue or configure your AI tools. Review the source, instructions, scripts, and license before using or sharing imported skills. Use a separate command file for each supported command family.

## What's in the catalogue?

The published catalogue contains **408 skills across 19 categories**. Only reviewed, approved skill payloads are included in the npm package. Some third-party content is excluded when permission to redistribute it cannot be established.

Browse the [catalogue](https://github.com/Audaa-Cyber/orchill/blob/main/catalog/CATALOG.md) or see the [category list](https://github.com/Audaa-Cyber/orchill/tree/main/catalog/categories).

## Safety notes

- Orchill does not automatically run installed skill scripts.
- Installing Orchill does not automatically configure every AI app.
- Skill instructions and scripts come from their respective sources. Review them before trusting an agent to use them.
- A license label alone does not prove that third-party content is safe or may be redistributed.
- `orchill check` checks the expected structure and Orchill marker; it is not a malware scanner or cryptographic integrity audit.

For more details, read the [security guide](https://github.com/Audaa-Cyber/orchill/blob/main/docs/SECURITY.md).

## Development

To work from the source repository:

```sh
git clone https://github.com/Audaa-Cyber/orchill.git
cd orchill
npm install
npm run build
npm test
```

For release and contribution details, see the [project repository](https://github.com/Audaa-Cyber/orchill).

## License

Orchill's original code and documentation use the [Apache 2.0 license](https://github.com/Audaa-Cyber/orchill/blob/main/LICENSE). Third-party skills retain their own licensing and redistribution terms.
