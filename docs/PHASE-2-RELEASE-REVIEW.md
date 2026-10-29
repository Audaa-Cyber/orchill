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

The release-review queue groups imported skills using the recorded Skills CLI repository hint or marketplace plugin provenance. This is a triage aid only: a command string is not proof that the copied payload matches that repository, that the import came from the stated commit, or that the exact skill and bundled assets may be redistributed. The queue currently has 55 source groups and no `unknown-origin` group based on those hints. After the dotnet and MicrosoftDocs batches below, 113 entries have complete evidence and 108 still require review. Verify exact content and immutable revisions before recording any approval.

## Verified batch: dotnet/skills

On 2026-10-29, an automated source-and-license review covered 81 imported skills from the official [dotnet/skills repository](https://github.com/dotnet/skills), pinned to commit `95e7d0cb7994d47b5789baa68e13f7a2f348b956`. All 238 files across those 81 local skill directories matched the corresponding upstream file paths and Git blob SHAs exactly. The repository-root MIT license at [the pinned LICENSE file](https://github.com/dotnet/skills/blob/95e7d0cb7994d47b5789baa68e13f7a2f348b956/LICENSE) grants redistribution subject to retaining the copyright and permission notice. Orchill now records this evidence in `registry/release-approvals.json` and ships that notice through `THIRD_PARTY_NOTICES.md`.

This is an **automated evidence review**, not legal advice or a claim that a human maintainer has signed off. The review ledger identifies the method transparently. A maintainer should confirm the record before publishing. These 81 records do not clear the other 140 skills; the strict release gate must remain blocked until those are resolved.

## Verified batch: MicrosoftDocs/Agent-Skills

On 2026-10-29, an automated source-and-license review covered 19 imported skills from [MicrosoftDocs/Agent-Skills](https://github.com/MicrosoftDocs/Agent-Skills), pinned to commit `95544200a6621ee7481b253beb115ac0be701689`. All 34 files across those 19 local skill directories matched the corresponding upstream file paths and Git blob SHAs exactly. The repository-root [LICENSE at the pinned commit](https://github.com/MicrosoftDocs/Agent-Skills/blob/95544200a6621ee7481b253beb115ac0be701689/LICENSE) identifies Creative Commons Attribution 4.0 International (CC BY 4.0). The copies are unchanged; the package notices identify the source and license and link to the full license terms.

This is an **automated evidence review**, not legal advice or a claim that a human maintainer has signed off. A maintainer should confirm the record before publishing. At this stage, the dotnet and MicrosoftDocs batches together had 100 entries with complete recorded evidence.

## Verified batch: openai/skills

On 2026-10-29, an automated source-and-license review covered 13 imported skills from [openai/skills](https://github.com/openai/skills), pinned to commit `49f948faa9258a0c61caceaf225e179651397431`. All 432 files across those 13 local skill directories matched the corresponding upstream file paths and Git blob SHAs exactly. Each skill has its own `LICENSE.txt` inside the copied directory: 12 use Apache-2.0 and `notion-knowledge-capture` uses MIT. The per-skill license files are included in the package, and `THIRD_PARTY_NOTICES.md` links to the exact evidence.

Two additional imported skills, `figma` and `figma-implement-design`, are explicitly marked **proprietary / redistribution not approved pending review**. Their license files state that use is governed by Figma Developer Terms and describe the materials as a beta feature; they do not grant a standard open-source license. They have no approval records and remain critical blockers. Do not include them in a public release unless the applicable terms are reviewed and redistribution is confirmed, or they are removed from the published package.

This is an **automated evidence review**, not legal advice or a claim that a human maintainer has signed off. The maintainer should confirm the records before publication. Across the three reviewed source batches, 113 entries have complete evidence and 108 remain unresolved.

## Publication policy
Do not publish a release containing local third-party payloads until the strict evidence gate and clean packed-package install test pass. Apache-2.0 applies to Orchill's own code, not automatically to imported skills.
