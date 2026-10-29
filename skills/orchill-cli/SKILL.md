---
name: orchill-cli
description: Use Orchill to discover, inspect, install, verify, update, and remove reusable AI-agent skills. Use when a task may benefit from a skill in the Orchill catalogue.
---

# Using Orchill

Orchill is a CLI and catalogue for reusable agent skills. It installs skills as files; it does not automatically load every installed skill into the agent's context or execute its scripts.

## Start here

1. Run `orchill --help` to discover the commands supported by the installed version.
2. Run `orchill --version` to record the installed version.
3. Use the actual CLI help to list categories and skills, inspect the candidate's metadata, and determine the destination.
4. Install only the requested skill or category. Install the whole catalogue only when explicitly requested.
5. After installation, read the installed skill's `SKILL.md` and any files it references when they are relevant to the task.

## Operating rules

- Use the same commands and semantics exposed to human users; do not invent agent-specific CLI commands.
- Check provenance, licensing, and exclusion status before selecting content. Never bypass an explicit block.
- Preserve the full directory tree, including references, scripts, examples, and assets.
- Inspect scripts before executing them. Installation is not permission to execute code.
- Do not overwrite or delete user content without authorization.
- Report the skills installed, destination, any skipped content, and verification results.
- If the installed CLI does not support an operation described in external documentation, follow the installed `orchill --help` and state the limitation rather than guessing.

## Compatibility

Agent discovery depends on the host. A host that supports skill directories can load a skill from its configured skill location; other hosts may need project instructions or an explicit integration. Installing the Orchill npm package alone does not automatically configure every AI agent.
