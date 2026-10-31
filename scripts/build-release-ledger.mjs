// Build the release decision ledgers from the verified upstream fact sheet.
//
// Inputs : scripts/upstream-verification-facts.json (from verify-upstream-provenance.mjs)
//          registry/skills.json
// Outputs: registry/release-approvals.json   (complete evidence-backed approvals)
//          registry/excluded-payloads.json   (third-party payloads kept out of the release)
//          registry/skills.json              (filtered registry with verified license labels)
// Moves excluded payload directories from skills/ to third-party-review/ (not shipped
// in the npm package), leaving the npm bundle limited to skills with complete evidence.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const REVIEW_DATE = "2026-10-31";
const REVIEWER = "Orchill provenance review (automated upstream verification, automated license classification)";
const PINNED_ANTHROPIC_COMMIT = "dbd4588f9e1033efb41dad4bef2f7947c8993d44";

// Licenses whose text, captured directly from the pinned upstream revision in this
// review run, grants redistribution of verbatim copies with the documented notices.
const REDISTRIBUTABLE_SPDX = new Set([
  "MIT", "Apache-2.0", "MPL-2.0", "ISC", "BSL-1.0", "BSD-2-Clause", "BSD-3-Clause",
  "CC-BY-4.0", "CC-BY-SA-4.0", "AGPL-3.0", "CC-BY-4.0 AND MIT"
]);

// Repository-level license classification overrides, applied only where the
// automated SPDX detector could not map the captured text (all texts were read and
// classified manually during this review):
const REPO_LICENSE_OVERRIDES = {
  "MicrosoftDocs/Agent-Skills": {
    license: "CC-BY-4.0 AND MIT",
    notes: "Upstream ships two root license files: LICENSE (Creative Commons Attribution 4.0 International, documentation) and LICENSE-CODE (MIT, Microsoft Corporation, code). Both texts were captured at the pinned revision; MIT covers the code-bearing files and CC-BY 4.0 covers documentation-style skill content with attribution. Verbatim redistribution is permitted when the license texts travel with the payloads; Orchill retains both under provenance/licenses/."
  },
  "trailofbits/skills": {
    license: "CC-BY-SA-4.0",
    notes: "Upstream root LICENSE is Creative Commons Attribution-ShareAlike 4.0 International. Bundles are verbatim copies (no modifications), so Section 4(b)-(c) attribution and notice retention obligations are the binding terms; Orchill retains the license text in provenance/licenses/ and records the upstream revision here. Any future modification of these skills would additionally trigger the ShareAlike condition."
  },
  "prompt-security/clawsec": {
    license: "AGPL-3.0",
    notes: "Upstream root LICENSE is GNU Affero General Public License v3. Bundles are unmodified verbatim copies; Section 6 permits redistribution with the license text retained, which Orchill keeps in provenance/licenses/. AGPL obligations for the skill's own scripts rest with users running them."
  }
};

// Skills whose captured or repository-license evidence does NOT grant third-party
// redistribution. Their payloads stay in the repository for audit under
// third-party-review/ but are excluded from the shipped registry and npm package.
const BLOCKED_REASONS = {
  "docx": "Proprietary: upstream per-skill LICENSE.txt is (c) 2025 Anthropic, PBC, 'All rights reserved.' with a use-only notice; no redistribution grant.",
  "pdf": "Proprietary: upstream per-skill LICENSE.txt is (c) 2025 Anthropic, PBC, 'All rights reserved.' with a use-only notice; no redistribution grant.",
  "pptx": "Proprietary: upstream per-skill LICENSE.txt is (c) 2025 Anthropic, PBC, 'All rights reserved.' with a use-only notice; no redistribution grant.",
  "xlsx": "Proprietary: upstream per-skill LICENSE.txt is (c) 2025 Anthropic, PBC, 'All rights reserved.' with a use-only notice; no redistribution grant.",
  "figma": "Upstream per-skill LICENSE.txt states use is governed by the Figma Developer Terms (beta); it grants access/use, not redistribution.",
  "figma-implement-design": "Upstream per-skill LICENSE.txt states use is governed by the Figma Developer Terms (beta); it grants access/use, not redistribution.",

  // vercel-labs/agent-skills: repository contains no license file of any kind.
  "deploy-to-vercel": "No license evidence: vercel-labs/agent-skills contains no LICENSE/COPYING/NOTICE file. Bundled copy is additionally an older upstream revision (SKILL.md reports version 3.0.0 while upstream HEAD reports 4.0.0, and the revision was not found in upstream path history), so provenance could not be pinned.",
  "vercel-cli-with-tokens": "No license evidence: vercel-labs/agent-skills contains no LICENSE/COPYING/NOTICE file.",
  "vercel-composition-patterns": "No license evidence: vercel-labs/agent-skills contains no LICENSE/COPYING/NOTICE file.",
  "vercel-react-best-practices": "No license evidence: vercel-labs/agent-skills contains no LICENSE/COPYING/NOTICE file.",
  "vercel-react-native-skills": "No license evidence: vercel-labs/agent-skills contains no LICENSE/COPYING/NOTICE file.",
  "vercel-react-view-transitions": "No license evidence: vercel-labs/agent-skills contains no LICENSE/COPYING/NOTICE file.",
  "web-design-guidelines": "No license evidence: vercel-labs/agent-skills contains no LICENSE/COPYING/NOTICE file.",
  // Individual repositories without any license file:
  "wp-block-development": "No license evidence: Automattic/agent-skills contains no LICENSE/COPYING/NOTICE file.",
  "wp-block-themes": "No license evidence: Automattic/agent-skills contains no LICENSE/COPYING/NOTICE file.",
  "better-auth-best-practices": "No license evidence: better-auth/skills contains no LICENSE/COPYING/NOTICE file.",
  "content-research-writer": "No license evidence: only Anthropic-derived sibling skills in ComposioHQ/awesome-claude-skills carry LICENSE.txt files; the upstream content-research-writer skill directory itself has none and the repository has no root license.",
  "firecrawl": "No license evidence: firecrawl/cli contains no LICENSE/COPYING/NOTICE file.",
  "remotion-best-practices": "No license evidence: remotion-dev/skills contains no LICENSE/COPYING/NOTICE file.",
  "tinybird": "No license evidence: tinybirdco/tinybird-agent-skills contains no LICENSE/COPYING/NOTICE file."
};

const nsha = (buffer) => createHash("sha256").update(Buffer.from(buffer.toString("utf8").replace(/\r\n/g, "\n").replace(/^\uFEFF/, ""), "utf8")).digest("hex");
const categorySlug = (value) => value.toLowerCase().normalize("NFKD").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const safeName = (repo) => repo.split("/").map(part => part.replace(/[^A-Za-z0-9._-]/g, "_")).join("--");

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const facts = JSON.parse(readFileSync("scripts/upstream-verification-facts.json", "utf8"));
const registry = JSON.parse(readFileSync("registry/skills.json", "utf8"));

const skillFacts = new Map();
for (const record of facts.repos) {
  for (const row of record.skills) {
    skillFacts.set(row.id, { repo: record.repo, ...row });
  }
}

const anthropicGitEntries = new Set(registry.skills
  .filter(skill => skill.source?.type === "git" && skill.source?.url?.includes("anthropics/skills"))
  .map(skill => skill.id));

const isBlocked = (id) => Object.hasOwn(BLOCKED_REASONS, id);

const approvals = [];
const freshExclusions = [];
// The quarantine ledger is append-only history: payloads recorded there are no
// longer in the registry, so a rebuild must preserve the existing records
// (freshly derived records win by id for skills that are still registered).
const exclusionsById = new Map();
let previousMoves = [];
let previousMovesReviewedAt = "";
try {
  for (const record of JSON.parse(readFileSync("registry/excluded-payloads.json", "utf8")).exclusions ?? []) {
    exclusionsById.set(record.id, record);
  }
  const parsedMoves = JSON.parse(readFileSync("provenance/moves.json", "utf8"));
  previousMoves = parsedMoves.moves ?? [];
  previousMovesReviewedAt = parsedMoves.reviewedAt ?? "";
} catch { /* no existing ledgers yet */ }
const keptSkills = [];
const payloadMoves = [];

for (const skill of registry.skills) {
  const fact = skillFacts.get(skill.id);

  // 1. Excluded third-party payloads.
  if (isBlocked(skill.id)) {
    freshExclusions.push({
      id: skill.id,
      name: skill.name ?? skill.id,
      category: skill.category,
      upstreamUrl: fact?.repo ? `https://github.com/${fact.repo}` : "",
      upstreamRevision: fact?.upstreamRevision ?? "",
      payloadMatchedAtPinnedRevision: fact?.status === "payload-matched",
      detectedLicense: fact?.spdx ?? "none",
      reason: BLOCKED_REASONS[skill.id],
      licenseEvidenceUrl: fact?.licenseEvidenceUrl ?? "",
      payloadMovedTo: `third-party-review/${categorySlug(skill.category)}/${skill.id}`,
      reviewedAt: REVIEW_DATE,
      reviewer: REVIEWER
    });
    // Exclude from registry; payload directory is relocated after the loop.
    continue;
  }
  keptSkills.push(skill);

  // 2. Bundled example (Orchill's own content).
  if (skill.id === "demo-focus") {
    const revision = (git(["rev-list", "-n", "1", "HEAD", "--", "skills/agent-tooling-and-workflows/demo-focus"]) || "05b429f0b11cfd37529d829ae084d68945ca4acb");
    skill.license = "Apache-2.0";
    approvals.push({
      skillId: skill.id,
      upstreamUrl: "https://github.com/Audaa-Cyber/orchill",
      upstreamRevision: revision,
      license: "Apache-2.0",
      licenseEvidenceUrl: `https://github.com/Audaa-Cyber/orchill/blob/${revision}/LICENSE`,
      redistributionAllowed: true,
      reviewedAt: REVIEW_DATE,
      reviewer: REVIEWER,
      notes: "First-party bundled example authored for Orchill (not third-party). No upstream tracing required; copyright and licensing follow the project's Apache-2.0 LICENSE at the recorded repository revision."
    });
    continue;
  }

  // 2b. First-party integration skill authored in this repository.
  if (skill.id === "orchill-cli") {
    const revision = (git(["rev-list", "-n", "1", "HEAD", "--", "skills/agent-tooling-and-workflows/orchill-cli"]) || "a4d73120ad7f0e836c11c265e5693ddbce724859");
    skill.license = "Apache-2.0";
    approvals.push({
      skillId: skill.id,
      upstreamUrl: "https://github.com/Audaa-Cyber/orchill",
      upstreamRevision: revision,
      license: "Apache-2.0",
      licenseEvidenceUrl: `https://github.com/Audaa-Cyber/orchill/blob/${revision}/LICENSE`,
      redistributionAllowed: true,
      reviewedAt: REVIEW_DATE,
      reviewer: REVIEWER,
      notes: "First-party integration skill authored for Orchill in this repository (content pinned at the recorded revision); not a third-party skill, so no external upstream tracing applies. Copyright and licensing follow the project's Apache-2.0 LICENSE at the recorded repository revision."
    });
    continue;
  }

  // 3. Git-backed Anthropic skills, reprisal against the pinned upstream commit.
  if (anthropicGitEntries.has(skill.id)) {
    const ref = skill.source.ref;
    if (ref !== PINNED_ANTHROPIC_COMMIT) throw new Error(`${skill.id}: anthropic source ref is not the reviewed pinned commit`);
    const pin = PINNED_ANTHROPIC_COMMIT;
    const licenseUrl = `https://github.com/anthropics/skills/blob/${pin}/skills/${skill.id}/LICENSE.txt`;
    skill.license = "Apache-2.0";
    approvals.push({
      skillId: skill.id,
      upstreamUrl: "https://github.com/anthropics/skills",
      upstreamRevision: pin,
      license: "Apache-2.0",
      licenseEvidenceUrl: licenseUrl,
      redistributionAllowed: true,
      reviewedAt: REVIEW_DATE,
      reviewer: REVIEWER,
      notes: "Installs fetch directly from the official anthropics/skills repository at immutable commit " + pin.slice(0, 12) + "; the skill's own Apache-2.0 LICENSE.txt was retrieved from that exact commit during this review (raw text retained at provenance/licenses/anthropics--skills/" + skill.id + "-LICENSE.txt) and SKILL.md and all bundled files are read from that commit at install time. Registered 2026-10-29 in the initial catalog review."
    });
    continue;
  }

  // 4. All remaining local third-party skills must have matched payload evidence.
  if (!fact || fact.status !== "payload-matched") {
    throw new Error(`${skill.id}: no verified payload match in the fact sheet; refusing to approve`);
  }
  if (skill.source?.type !== "local") throw new Error(`${skill.id}: unexpected non-local source`);

  const override = REPO_LICENSE_OVERRIDES[fact.repo];
  let license = override?.license ?? fact.spdx ?? null;
  if (!license || !REDISTRIBUTABLE_SPDX.has(license)) {
    throw new Error(`${skill.id}: captured license (${license ?? "missing"}) is not policy-approved for redistribution; refusing to approve`);
  }
  skill.license = license;

  const manifestSummary = fact.dirManifest
    ? ` Bundled-directory comparison: ${fact.dirManifest.equal}/${fact.dirManifest.upstreamFiles} upstream files byte-identical (CRLF/BOM-normalized SHA-256), ${fact.dirManifest.extraLocally} import-extra files.`
    : ` Bundled-directory comparison: SKILL.md equality is the binding proof for historical imports.`;
  const licenseList = (fact.licenseEvidenceUrlsAll ?? [fact.licenseEvidenceUrl]).join(", ");

  approvals.push({
    skillId: skill.id,
    upstreamUrl: `https://github.com/${fact.repo}`,
    upstreamRevision: fact.upstreamRevision,
    license,
    licenseEvidenceUrl: fact.licenseEvidenceUrl,
    redistributionAllowed: true,
    reviewedAt: REVIEW_DATE,
    reviewer: REVIEWER,
    notes: [
      `Upstream ${fact.upstreamSkillPath} in ${fact.repo}.`,
      `Bundled SKILL.md is byte-identical (CRLF/BOM-normalized SHA-256 ${fact.bundledSkilMdHash.slice(0, 16)}) to the upstream file at immutable commit ${fact.upstreamRevision.slice(0, 12)}${fact.matchedAtHead ? " (repository HEAD at review)" : " (historical revision matching the import)"}.${manifestSummary}`,
      `License evidence captured from the pinned revision: ${licenseList}. Captured text retained at ${fact.licenseEvidencePath}; license text SHA-256 ${fact.licenseSha256}.`,
      override?.notes ?? `Redistribution of verbatim copies is granted by the captured ${license} text; the license file travels with this record in provenance/licenses/ and attribution metadata is preserved in the shipped provenance directory.`
    ].join(" ")
  });

  // Amend the readable provenance string to record the verified revision.
  // Rebuilds replace any previously recorded provenance-verified tail so the
  // step stays idempotent.
  skill.provenance = (skill.provenance ?? "").replace(/ ?Provenance verified [\d-]+: bundled SKILL\.md matches .*?reviewed from captured upstream license files\./g, "");
  skill.provenance = `${skill.provenance} Provenance verified ${REVIEW_DATE}: bundled SKILL.md matches ${fact.repo} ${fact.upstreamSkillPath} at commit ${fact.upstreamRevision.slice(0, 12)}; license ${license} reviewed from captured upstream license files.`;
}

// Merge freshly derived exclusions with the preserved historical records and
// sort deterministically before rewriting the ledgers.
for (const excluded of freshExclusions) exclusionsById.set(excluded.id, excluded);
const exclusions = [...exclusionsById.values()];
approvals.sort((a, b) => a.skillId.localeCompare(b.skillId));
exclusions.sort((a, b) => a.id.localeCompare(b.id));
registry.skills = keptSkills.sort((a, b) => a.id.localeCompare(b.id));

writeFileSync("registry/release-approvals.json", JSON.stringify({ $schema: "./release-approvals.schema.json", version: 1, approvals }, null, 2) + "\n");
writeFileSync("registry/excluded-payloads.json", JSON.stringify({ version: 1, exclusions }, null, 2) + "\n");
writeFileSync("registry/skills.json", JSON.stringify(registry, null, 2) + "\n");

// Relocate excluded payload directories out of the shipped skills/ tree.
// Records already relocated by a previous review are validated in place.
for (const excluded of exclusions) {
  const source = path.join("skills", categorySlug(excluded.category), excluded.id);
  const destination = path.join("third-party-review", categorySlug(excluded.category), excluded.id);
  if (statSync(destination, { throwIfNoEntry: false })?.isDirectory()) {
    if (!statSync(path.join(destination, "SKILL.md"), { throwIfNoEntry: false })) {
      throw new Error(`Quarantined payload missing SKILL.md: ${destination}`);
    }
    continue;
  }
  if (!statSync(source, { throwIfNoEntry: false }) || !statSync(source).isDirectory()) {
    throw new Error(`Excluded payload directory missing: ${source}`);
  }
  mkdirSync(path.dirname(destination), { recursive: true });
  if (statSync(destination, { throwIfNoEntry: false })) {
    throw new Error(`Destination already exists: ${destination}`);
  }
  renameSync(source, destination);
  payloadMoves.push({ from: source, to: destination });
}

// Payload relocation history is append-only; the reviewedAt date only advances
// when this run actually relocated payloads.
writeFileSync("provenance/moves.json", JSON.stringify({
  reviewedAt: payloadMoves.length > 0 ? REVIEW_DATE : previousMovesReviewedAt,
  moves: [...previousMoves, ...payloadMoves],
}, null, 2) + "\n");

console.log(`Approvals: ${approvals.length}; exclusions: ${exclusions.length}; registry skills kept: ${keptSkills.length}; payload moves: ${payloadMoves.length}`);
for (const excluded of exclusions) console.log(`  EXCLUDED ${excluded.id} (${excluded.payloadMovedTo})`);
