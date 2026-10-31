# Import staging receipts

When `orchill import` (or, for one documented exception, the manual K-Dense
staging script) copies skill payloads, it stages them into a temporary
`.orchill-<name>/` workspace and writes receipts there: the parsed command
report (`report.json`, `report.md`) and the generated registry entries
(`registry-additions.json`). After the payloads are moved into
`skills/<category-slug>/<skill-id>/` and registered in `registry/skills.json`,
the staging workspace is deleted and only these receipts are retained here as
evidence of what the importer recorded at import time.

Subdirectories:

- `2026-10-29-earlier/` — receipts from the Skills CLI and agent-marketplace
  import sessions of 2026-10-29 that populated the original local catalogue.
- `2026-10-30-uiux/` — receipts from the UI/UX import batch (K-Dense-AI 177,
  addyosmani 25, nutlope/hallmark, petergyang/no-ai-slop,
  dimillian/skills swiftui-ui-patterns, emilkowalski/skills apple-design),
  run in parallel chunks (`.orchill-uiux-import-{small,a,b,c,hallmark,kdense}`),
  plus the full command list (`commands.txt`, whose `#` comments also document
  the declined imports: VoltAgent/awesome-claude-design awesome-list with no
  installable skills, the proprietary 21st.dev CLI, the duplicate
  avdlee/swiftui-agent-skill already shipped as `swiftui-expert-skill`, and an
  unsupported `-g` flag).

The K-Dense payloads were staged manually
(`scripts/stage-kdense-import.mjs`, run in `2026-10-30-uiux/…-kdense-*`)
because the Skills CLI remote fetch of that repository fails repeatedly in the
operating environment (curl 56 early-EOF disconnects on this connection);
every staged payload is afterwards proven byte-identical to the canonical
GitHub upstream at a pinned revision by `scripts/verify-upstream-provenance.mjs`.
