# Security notes

Orchill installs files; it does not run skill scripts. Skills are instructions and assets, and may still influence an agent that reads them. Treat skills from outside your organization as untrusted input.

## Before adding a source to a shared registry

1. Confirm the canonical upstream repository and exact directory.
2. Review the skill instructions and every referenced script, prompt, or binary.
3. Check the license and redistribution terms. Do not infer a license from the repository name.
4. Pin a reviewed tag or commit in `source.ref` when practical.
5. Record the source and review date in `provenance`.
6. Test the entry with a throwaway project before publishing it.

## MVP protections

- Registry metadata rejects unknown fields at the root, skill, and source levels.
- Required metadata and optional license/provenance values must be non-empty.
- Skill IDs are constrained to lowercase alphanumeric, dot, underscore, and hyphen characters.
- Skill paths reject absolute paths and traversal outside their source.
- Targets are restricted to the implemented adapters: project, agents, Claude, and Codex.
- Git sources must use HTTPS and reject embedded credentials, query strings, and fragments.
- Git commands use argument arrays with `shell: false`; the URL is not interpolated into a shell command.
- Copies reject symbolic links rather than following them.
- Destination parent symlinks are rejected.
- Existing installs require explicit `--force`; replacement is staged and the prior install is restored if the swap fails.
- Category installs show a plan and require confirmation unless `--yes` is passed.

## Known gaps before a security-focused release

This is an MVP, not a security certification. Runtime validation and the published JSON Schema must be kept aligned by tests/review; no cryptographic source signatures or license allowlist are enforced. Orchill does not sandbox an agent, inspect prompt injection, maintain a lockfile, or perform a full source-tree audit. Registry files are configuration and should come from trusted maintainers. Local source paths are intentionally useful for development and should not be accepted from untrusted registries. Review the implementation and test in disposable directories before production use.
