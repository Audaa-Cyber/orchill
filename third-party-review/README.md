# Third-party review quarantine

Payloads in this tree are third-party skill copies whose upstream license
evidence does **not** grant redistribution rights (proprietary license texts,
service-terms-only license files, or upstreams with no license at all). They are
kept in the repository for audit and future outreach, but are **excluded from
the shipped npm package**: `"skills"` in `package.json` does not include this
directory, the payloads are not referenced by `registry/skills.json`, and CI
fails if any excluded payload is re-registered or re-added under `skills/`.

Each order is recorded in `registry/excluded-payloads.json` with the upstream
repository, detected license evidence (if any), and the blocking reason.

To publish one of these skills upstream-agnostically, obtain a redistribution
grant or an explicit permissive license from the upstream author, re-run
`node scripts/verify-upstream-provenance.mjs` for that repository, and move the
payload back under `skills/<category>/<id>/` with a complete entry in
`registry/release-approvals.json`.
