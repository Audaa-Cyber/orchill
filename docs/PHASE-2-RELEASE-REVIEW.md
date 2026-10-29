# Phase 2: release review and safe publication

Keep the full development catalogue in the repository, but do not distribute third-party skill payloads until each exact upstream source, immutable revision, license evidence, and redistribution right has been reviewed and recorded.

## Review workflow
1. Generate JSON with `npm run release:review-queue`.
2. Generate spreadsheet-friendly CSV with `npm run release:review-queue -- --format=csv --output=reports/release-review-queue.csv`.
3. Review by `sourceGroup`, then verify each skill's exact directory and content at a pinned commit. A repository-wide license is evidence to inspect, not proof that every imported file has identical terms.
4. Check actual license and NOTICE/attribution obligations. Never infer MIT, Apache-2.0, or another license from missing evidence.
5. Add a complete entry to `registry/release-approvals.json` only after review. Do not fabricate a reviewer, revision, or permission statement. The strict release check remains the final gate.

## Current findings
The approval ledger is intentionally empty. The report marks every skill as needing evidence; a registry license label does not equal approval. The 209 local payloads are the primary redistribution concern. Remote Git entries also need accurate source/revision/license metadata and a clear distribution decision.

The release-review queue groups imported skills using the recorded Skills CLI repository hint or marketplace plugin provenance. This is a triage aid only: a command string is not proof that the copied payload matches that repository, that the import came from the stated commit, or that the exact skill and bundled assets may be redistributed. The queue currently has 55 source groups and no `unknown-origin` group based on those hints. After the dotnet batch review below, 81 entries have complete evidence and 140 still require review. Verify exact content and immutable revisions before recording any approval.

## Verified batch: dotnet/skills

On 2026-10-29, an automated source-and-license review covered 81 imported skills from the official [dotnet/skills repository](https://github.com/dotnet/skills), pinned to commit `95e7d0cb7994d47b5789baa68e13f7a2f348b956`. All 238 files across those 81 local skill directories matched the corresponding upstream file paths and Git blob SHAs exactly. The repository-root MIT license at [the pinned LICENSE file](https://github.com/dotnet/skills/blob/95e7d0cb7994d47b5789baa68e13f7a2f348b956/LICENSE) grants redistribution subject to retaining the copyright and permission notice. Orchill now records this evidence in `registry/release-approvals.json` and ships that notice through `THIRD_PARTY_NOTICES.md`.

This is an **automated evidence review**, not legal advice or a claim that a human maintainer has signed off. The review ledger identifies the method transparently. A maintainer should confirm the record before publishing. These 81 records do not clear the other 140 skills; the strict release gate must remain blocked until those are resolved.

## Publication policy
Do not publish a release containing local third-party payloads until the strict evidence gate and clean packed-package install test pass. Apache-2.0 applies to Orchill's own code, not automatically to imported skills.
