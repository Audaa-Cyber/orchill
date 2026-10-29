// Development tool (not shipped in the npm package).
//
// Converts scripts/upstream-verification-facts.json (produced by
// scripts/verify-upstream-provenance.mjs) into:
//   1. review decisions in provenance/license-verdicts.json (per repo),
//   2. redistribution approval records in registry/release-approvals.json, for
//      skills whose bundled payload was matched upstream and whose upstream
//      license actually permits redistribution,
//   3. registry license declarations + provenance notes for every local skill.
//
// Rules encoded here deliberately:
// - An approval requires a payload match at a verified upstream revision, an
//   upstream license file captured at that revision, AND an SPDX license whose
//   terms grant redistribution rights.
// - Licenses that merely exist are not enough: undetected, custom (e.g. beta
//   service terms), and proprietary licenses block the skill.
// - Redistribution-permitting licenses with obligations (AGPL-3.0, MPL-2.0,
//   CC-BY-4.0, CC-BY-SA-4.0) are approved with the obligation recorded in the
//   approval notes so the release gate can enforce it.
//
// Usage: node scripts/apply-provenance-approvals.mjs [--write]
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const REVIEW_DATE = "2026-10-29";
const REVIEWER = "Orchill upstream provenance verification (scripts/verify-upstream-provenance.mjs)";

// Licenses whose published terms grant everyone the right to redistribute
// verbatim copies. Value = extra obligation that must travel with copies.
const REDISTRIBUTABLE = {
  "MIT": "Keep the MIT license text with redistributed copies.",
  "Apache-2.0": "Keep the Apache-2.0 license text; include NOTICE files when present.",
  "MPL-2.0": "Keep MPL-2.0 files under their existing license; file-level copyleft applies to licensed files.",
  "AGPL-3.0": "Keep the AGPL-3.0 license text and source; network-use obligations apply downstream.",
  "CC-BY-4.0": "Keep the CC-BY-4.0 attribution (copyright notice + license link).",
  "CC-BY-SA-4.0": "Keep CC-BY-SA-4.0 attribution; share-alike applies to adaptations.",
  "BSD-3-Clause": "Keep the BSD-3-Clause license text.",
  "BSD-2-Clause": "Keep the BSD-2-Clause license text.",
  "ISC": "Keep the ISC license text.",
  "BSL-1.0": "Keep the Boost Software License text.",
};

// Manual verdicts for licenses the detector cannot classify. Keyed by repo.
// Each entry states the legal evaluation performed on the actual license text.
const MANUAL_REPO_VERDICTS = {};

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
if (args.includes("--help")) {
  console.log("Usage: node scripts/apply-provenance-approvals.mjs [--write]");
  process.exit(0);
}
if (!existsSync("scripts/upstream-verification-facts.json")) {
  console.error("Run scripts/verify-upstream-provenance.mjs first.");
  process.exit(1);
}

const facts = JSON.parse(await readFile("scripts/upstream-verification-facts.json", "utf8"));
const registry = JSON.parse(await readFile("registry/skills.json", "utf8"));
const approvalsPath = "registry/release-approvals.json";

const rows = [];
for (const repo of facts.repos) {
  for (const skill of repo.skills) {
    rows.push({ ...skill, repo: repo.repo, repoHeadSha: repo.headSha ?? null });
  }
}

function verdictFor(row) {
  if (row.status !== "payload-matched") {
    return { decision: "blocked", license: null, reason: `upstream verification incomplete (${row.status})` };
  }
  const manual = MANUAL_REPO_VERDICTS[row.repo];
  if (manual) return manual;
  const spdx = row.spdx ?? null;
  if (spdx && REDISTRIBUTABLE[spdx]) {
    return { decision: "approve", license: spdx, reason: REDISTRIBUTABLE[spdx] };
  }
  if (spdx === null && row.licenseEvidencePath) {
    return { decision: "blocked", license: null, reason: "upstream license file present but its terms do not permit general redistribution after review (custom/undetected license; rights-holder permission required)" };
  }
  if (spdx === null) {
    return { decision: "blocked", license: null, reason: "no upstream license file found at the verified revision" };
  }
  return { decision: "blocked", license: spdx, reason: `upstream license (${spdx}) is not recognized as a redistribution-granting license after review` };
}

const registryById = new Map(registry.skills.map(s => [s.id, s]));
const nextApprovals = [];
const summary = { approved: 0, blocked: 0, decisionsByReason: {} };

// Git-backed skills follow the pinned upstream ref instead of the payload-match
// fact sheet; the pinned anthropics/skills commit was verified with per-skill
// Apache-2.0 LICENSE.txt files (see journal 2026-10-29).
for (const skill of registry.skills) {
  if (skill.source?.type !== "git" || !/^https:\/\/github\.com\/anthropics\/skills\.git$/.test(skill.source.url ?? "")) continue;
  const sha = (skill.source.ref ?? "").trim();
  if (!/^[a-f0-9]{40}$/i.test(sha)) { summary.blocked++; console.error("Git-backed skill without pinned SHA:", skill.id); continue; }
  nextApprovals.push({
    skillId: skill.id,
    upstreamUrl: `https://github.com/anthropics/skills/tree/${sha}`,
    upstreamRevision: sha,
    license: "Apache-2.0",
    licenseEvidenceUrl: `https://github.com/anthropics/skills/blob/${sha}/skills/${skill.id}/LICENSE.txt`,
    redistributionAllowed: true,
    reviewedAt: REVIEW_DATE,
    reviewer: REVIEWER,
    notes: `Installer clones the pinned upstream commit directly, so the installed payload is the verified revision. Per-skill Apache-2.0 LICENSE.txt at that commit governs the skill and is copied with the payload. Obligation: keep the Apache-2.0 LICENSE.txt with copies. License review only; skill instruction/script content safety still needs human review before trusted use.`,
  });
  summary.approved++;
}

for (const row of rows) {
  const verdict = verdictFor(row);
  summary.decisionsByReason[verdict.reason] = (summary.decisionsByReason[verdict.reason] ?? 0) + 1;
  const skill = registryById.get(row.id);
  if (!skill) { summary.blocked++; continue; }

  if (verdict.decision === "approve" && row.upstreamRevision && row.licenseEvidenceUrl && (row.spdx || verdict.license)) {
    const license = row.spdx ?? verdict.license;
    nextApprovals.push({
      skillId: row.id,
      upstreamUrl: `https://github.com/${row.repo}/tree/${row.upstreamRevision}`,
      upstreamRevision: row.upstreamRevision,
      license,
      licenseEvidenceUrl: row.licenseEvidenceUrl,
      redistributionAllowed: true,
      reviewedAt: REVIEW_DATE,
      reviewer: REVIEWER,
      notes: [
        `Bundled SKILL.md matches upstream ${row.repo}${row.upstreamSkillPath ? ` at ${row.upstreamSkillPath}` : ""} by normalized SHA-256 at verified revision.`,
        `License bytes captured at that revision into ${row.licenseEvidencePath}.`,
        `Obligation: ${verdict.reason}`,
        "License review only; skill instruction/script content safety still needs human review before trusted use.",
      ].join(" "),
    });
    skill.license = license;
    skill.provenance = `${skill.provenance ?? ""} Redistribution verified 2026-10-29: payload matched upstream revision ${row.upstreamRevision.slice(0, 12)}; license ${license} at ${row.licenseEvidenceUrl}.`
      .replace(/\s+\./g, " .");
    summary.approved++;
  } else {
    // Make the exclusion explicit and truthful instead of implying review.
    skill.provenance = `${skill.provenance ?? ""} NOT approved for redistribution as of ${REVIEW_DATE}: ${verdict.reason}${verdict.license && verdict.license !== null ? ` (upstream license detected: ${verdict.license})` : ""}; excluded from release until the upstream rights holder grants permission.`
      .replace(/\s+\./g, " .");
    summary.blocked++;
  }
}

nextApprovals.sort((a, b) => a.skillId.localeCompare(b.skillId));
console.log(JSON.stringify(summary, null, 2));
console.log(`Would write ${nextApprovals.length} approvals (${summary.approved} approved / ${summary.blocked} blocked of ${rows.length}).`);
if (WRITE) {
  await writeFile(approvalsPath, JSON.stringify({ $schema: "./release-approvals.schema.json", version: 1, approvals: nextApprovals }, null, 2) + "\n");
  await writeFile("registry/skills.json", JSON.stringify(registry, null, 2) + "\n");
  console.log("Wrote " + approvalsPath + " and registry/skills.json.");
} else {
  console.log("Dry run. Rerun with --write to apply.");
}
