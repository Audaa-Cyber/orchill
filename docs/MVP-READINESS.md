# MVP readiness and release gate

Last reviewed: 2026-10-29  
Branch reviewed: `feat/marketplace-bulk-import`

## Current implementation

- [x] TypeScript CLI with search, list, categories, info, registry, targets, and init commands.
- [x] Selective local and HTTPS Git-backed skill installation.
- [x] Category installation with a displayed plan and interactive confirmation by default.
- [x] Dry-run and explicit overwrite controls.
- [x] Registry validation, duplicate-ID checks, and path safety checks.
- [x] Local payload heuristic audit with JSON output and strict mode.
- [x] Bulk command and marketplace import adapters.
- [x] Generated master catalogue and per-category indexes.
- [x] CI workflow includes typecheck, tests, build, catalogue drift check, and package smoke tests.
- [x] Tests enforce that local registry entries map to category/skill folders and that generated catalogue indexes cover the registry.

## Release blockers (must be closed before calling this production-ready)

- [ ] Review and record license/redistribution evidence for every bundled third-party skill. A registry license string alone is not proof of permission. Do not publish payloads whose redistribution rights are unknown.
- [ ] Verify upstream repository, exact skill directory, and immutable revision for imported entries; record review provenance. Do not invent or infer missing license details.
- [ ] Add safe remote-source auditing before describing Git-backed entries as scanned. The current audit deliberately reports remote payloads as unscanned.
- [ ] Run the full CI workflow on the exact release commit and record the result. A missing status result is not a passing check.
- [ ] Test install, replacement rollback, category install, uninstall, and packaged CLI behavior on supported Node.js 22 environments.
- [ ] Review false positives and false negatives in heuristic security checks; document that a clean audit is not a security guarantee.
- [x] Add an evidence-backed redistribution approval ledger and make `npm publish` fail closed until every bundled skill has an approval record.
- [x] Add a provenance inventory command (JSON/CSV) that surfaces missing evidence without auto-approving skills; document the manual review workflow.
- [ ] Populate and independently review the approval ledger; the initial ledger is intentionally empty, so publishing is blocked.
- [ ] Decide a documented inclusion policy for imported skills and block unreviewed/redistribution-unclear entries from release artifacts.

## Release acceptance criteria

A release candidate is ready only when all of these are true:

1. `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run catalog:generate` succeed on a clean checkout, with no generated catalogue diff.
2. The packed tarball installs and its `orchill` executable passes smoke tests.
3. The registry, category indexes, and bundled payloads agree exactly.
4. Every distributed payload has reviewed provenance and compatible, evidenced redistribution terms.
5. No unresolved critical/high-risk security finding remains; review findings have documented disposition.
6. Release notes, version, and rollback instructions are prepared.

## Reproducible local checks

Run from the repository root with Node.js 22 or newer:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run catalog:generate
git diff --exit-code -- catalog
npm pack
```

These checks establish build and packaging integrity; they do not independently establish legal redistribution rights or prove that a skill is safe. Run `npm run provenance:inventory` to produce a per-skill JSON inventory (or `-- --format=csv --output=provenance-inventory.csv` for CSV), then run `npm run release:check` to report missing approval evidence. `npm publish` runs `prepublishOnly`, which uses strict mode and intentionally fails until every bundled skill has a complete approval record in `registry/release-approvals.json`. An approval requires the upstream URL, immutable commit hash, license and evidence URL, explicit redistribution permission, review date, reviewer, and notes. Do not add approvals unless the evidence has actually been reviewed.
