---
name: orchill-cli
description: Use Orchill to discover, inspect, install, update, remove, and verify reusable AI-agent skills. Use when a task may benefit from a skill in the Orchill catalogue.
---

# Using Orchill

Orchill is a CLI and catalogue for reusable agent skills. Humans and agents use the same commands.

## Start here

1. Run `orchill --help`.
2. Run `orchill --version`.
3. Run `orchill list` to see categories.
4. Run `orchill list <category>` to see skills.
5. Run `orchill info <name>` before selecting content.
6. Use `orchill add <name>` to install a skill or category.
7. Use `orchill add catalogue` only when the whole eligible catalogue is wanted.

## Folder preservation

A category install keeps the complete hierarchy:

`.agents/skills/<category>/<skill>/`

The complete skill directory is preserved, including `SKILL.md`, references, scripts, examples, and assets. Once installed, a skill is already present and should not be installed again individually.

## Operating rules

- Use the same commands and semantics exposed to human users; never invent agent-only CLI commands.
- Check provenance, licensing, and exclusion status before selecting content.
- Never bypass an explicit block or exclusion.
- Inspect scripts before executing them. Installation is not permission to execute code.
- Do not overwrite or delete user content without authorization.
- Use `orchill update`, `orchill remove <name>`, and `orchill check` for lifecycle operations.
- Report installed paths, skipped content, and verification results.

## Compatibility

Agent discovery depends on the host. A host may discover Orchill through `AGENTS.md`, this skill, or an MCP configuration. Installing the npm package alone does not automatically configure every AI agent. MCP, when configured, exposes the same Orchill operations rather than a separate command vocabulary.
