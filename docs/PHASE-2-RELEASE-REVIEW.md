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

## Publication policy
Do not publish a release containing local third-party payloads until the strict evidence gate and clean packed-package install test pass. Apache-2.0 applies to Orchill's own code, not automatically to imported skills.
