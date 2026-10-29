# npm release checklist

This checklist is intentionally conservative. A green CI run is necessary, but not enough by itself to publish a safe CLI package.

## Before the first public release

- [x] Merge the Apache-2.0 license alignment and confirm `package.json`, root `LICENSE`, and README agree.
- [x] Merge registry-validation hardening and confirm the runtime validator, JSON Schema, and tests are aligned.
- [x] Merge the install lifecycle safety and staged bulk-import changes after fresh CI passed. Bulk-import marketplace support and categorized catalogue are now integrated in main. Third-party payload approvals remain a release blocker.
- [ ] Confirm all catalog entries have verified upstream paths, immutable source refs where practical, per-skill license information, and provenance notes.
- [ ] Review bundled skill instructions and referenced scripts. CI and license checks are not a security audit.
- [ ] Check the exact npm package name `orchill` for availability, ownership, and possible naming conflicts. Do not assume availability from the repository name.
- [x] Add the canonical GitHub repository URL to `package.json`; npm trusted publishing requires repository metadata to match the source repository.
- [ ] Confirm the package includes the compiled CLI, registry, documentation, example skill, and license, and excludes source-only files or secrets not intended for distribution.
- [ ] Run `npm run release:preflight` against the exact release commit. It runs typecheck, tests, build, packed-package smoke test, and the strict per-skill redistribution approval gate.
- [ ] Inspect `npm pack --dry-run` output and confirm no unintended files or unapproved third-party payloads are included.
- [ ] Choose the first public version deliberately. The current development version is `0.1.0`; do not tag a release until the owner approves the version.
- [ ] Configure npm trusted publishing for this GitHub repository and the `Publish to npm` workflow. The workflow uses GitHub OIDC and npm provenance; it intentionally does not use a long-lived npm token secret.
- [ ] Create and publish a GitHub Release with a tag exactly matching the package version, such as `v0.1.0`, only after the release commit is approved.
- [ ] Verify the published npm page, provenance, install command, and a clean-machine smoke test after publication.

## Release preflight command

Run `npm ci` and then `npm run release:preflight` on the exact commit intended for release. The command exits non-zero if any required check fails, including if even one registry skill lacks complete evidence-backed redistribution approval. Do not bypass this failure to publish. The current approval ledger is empty, so the strict gate is expected to block publication until the real upstream/license review is complete.

The workflow repeats this gate on the release tag before `npm publish`. It also uses `npm ci` so the release build follows the committed lockfile.

## Publishing flow

1. Merge approved release-preparation changes into `main`.
2. Confirm the latest CI run for `main` is green.
3. Confirm npm trusted publishing is configured for the exact repository and workflow.
4. Set `package.json` to the approved version and merge that change.
5. Create a GitHub Release using the matching `vX.Y.Z` tag.
6. The `Publish to npm` workflow checks the tag/version and Apache-2.0 metadata, runs validation, inspects the package contents, and publishes with provenance.
7. Verify the npm package and installation from a fresh environment.

## Important limitations

- Creating a GitHub Release triggers publication; do not publish a release until all checks above are complete.
- The workflow expects the Apache-2.0 license PR to have landed first and intentionally fails closed if the package metadata still says MIT.
- npm trusted publishing must be configured in npm's package settings before the workflow can publish. This repository change cannot configure npm account settings on the owner's behalf.
- This workflow does not itself reserve or verify the npm package name.
- Publishing a CLI does not provide a hosted MCP server or automatically integrate with hosted AI chats.


## Phase 2 evidence review

- [ ] Generate and review `reports/release-review-queue.csv` by source group and priority.
- [ ] Keep imported third-party payloads out of npm until the strict approval gate passes.
- [ ] Confirm the packed tarball's `orchill` executable and install it in a clean temporary project.
