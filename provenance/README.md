# Upstream license evidence

License files in this directory are **verbatim captures** from the upstream
repository at the exact revision recorded for each skill in
`registry/release-approvals.json` (captured by
`node scripts/verify-upstream-provenance.mjs`, which clamps evidence to the
pinned commit — not the moving branch head).

- One subdirectory per upstream repository (`<owner>--<repo>/`).
- Skill-scoped license files are named `<skill-id>-LICENSE.txt`; root licenses
  keep their original file name (repositories with multiple root license files —
  e.g. Microsoft's `LICENSE` + `LICENSE-CODE` dual licensing — have all files
  captured).
- The capture URL for every file is listed in the owning approval record's
  `licenseEvidenceUrl` / notes (with `licenseEvidenceUrlsAll` contents recorded
  in the notes for multi-file repositories).

The npm package ships this directory, the approval ledger, and the review
reports so license obligations travel with every distributed payload. Skill
payloads lacking redistribution permission are **not** shipped and are not
mirrored here; they live in `../third-party-review/` with a documented reason.
