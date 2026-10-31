# K-Dense manual staging report

Upstream: K-Dense-AI/scientific-agent-skills (local clone at C:\Users\bintm\AppData\Local\Temp\orchill-new-skills\K-Dense-AI--scientific-agent-skills)

Staged: 177 skills -> .orchill-uiux-import-kdense/skills/

Reason: the Skills CLI remote fetch of this repository fails repeatedly in this
environment (curl 56 / early-EOF disconnects, also on direct git clone), so the
normal `orchill import` -> `npx skills add` path could not stage these payloads.
Integrity is established downstream by scripts/verify-upstream-provenance.mjs,
which re-clones the canonical GitHub upstream and proves every bundled SKILL.md
byte-identical at a pinned revision.

Review every skill's instructions and metadata. License classification is done from
the upstream license files captured by the verifier, not from frontmatter claims.
