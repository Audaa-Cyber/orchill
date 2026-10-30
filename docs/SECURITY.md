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

- IDs are constrained to lowercase alphanumeric, dot, underscore, and hyphen characters.
- Relative skill paths reject absolute paths and traversal.
- Git commands use argument arrays with `shell: false`; the URL is not interpolated into a shell command.
- Git sources must use HTTPS.
- Copies reject symbolic links rather than following them.
- Destination parent symlinks are rejected.
- Existing installs require explicit `--force`; replacement is staged and the prior install is restored if the swap fails.
- Category installs show a plan and require confirmation unless `--yes` is passed.

## Catalog review tooling

The public CLI intentionally exposes only the documented commands in `orchill --help`; catalog review is handled by repository release-review tooling rather than a separate CLI command. Run the repository's release checks before packaging. Heuristic findings require human review and are not proof that a skill is safe or correctly licensed.

## Known gaps before a security-focused release

This is an MVP, not a security certification. It does not verify Git commit signatures, enforce a license allowlist, sandbox an agent, inspect prompt injection, maintain a lockfile, or perform a full source-tree audit. Registry files are configuration and should come from trusted maintainers. Local source paths are intentionally useful for development and should not be accepted from untrusted registries. Review the implementation and test in disposable directories before production use.


## Project license versus skill licenses

The Orchill application code and original project documentation are licensed under Apache-2.0. This license does **not** grant redistribution rights for third-party skill payloads bundled in `skills/`. Each payload must be evaluated under its own upstream license and attribution requirements. A registry `license` value is metadata, not proof of permission. Before publishing a package or release, verify the source, exact upstream revision, license text, required notices, and redistribution terms for every bundled skill. Skills with unknown, incompatible, or unverified terms must be excluded from a distributable release until reviewed.
