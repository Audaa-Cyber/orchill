# Third-party skill provenance review

Orchill's Apache-2.0 license covers Orchill's own code. It does not automatically license third-party skill files in `skills/`.

## Build an inventory

Run on Node.js 22 or newer:

```sh
npm run provenance:inventory > provenance-inventory.json
npm run provenance:inventory -- --format=csv --output=provenance-inventory.csv
```

This inventory reports current registry metadata, approval-ledger fields, and missing evidence. It is not an approval or legal determination.

## Review each skill

1. Verify the original upstream repository and exact skill directory from a primary source.
2. Record the full immutable Git commit SHA reviewed; branch names and tags are not immutable revisions.
3. Inspect the actual license and any notices or additional terms. Link to direct HTTPS evidence and record the exact license identifier.
4. Determine whether the actual files may be redistributed and whether attribution or notices are required. If unclear, do not include the payload in a release until resolved.
5. Review content and scripts. The heuristic audit is a review aid, not a safety guarantee.
6. Record the reviewer, date, evidence, and decision in `registry/release-approvals.json`. Never bulk-fill approvals from inferred repository names or license labels.

## Release policy

`npm run release:check -- --strict` and `prepublishOnly` must remain fail-closed until every bundled payload has complete, evidence-backed approval. Skills without verified redistribution rights should be excluded from the bundled package. An upstream-only install mode would need pinned revisions, integrity checks, and clear third-party trust warnings.

This is an engineering workflow, not legal advice. Escalate ambiguous licensing terms for qualified review.
