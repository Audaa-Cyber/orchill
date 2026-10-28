import assert from "node:assert/strict";
import test from "node:test";
import { buildProvenanceInventory } from "../src/provenance.js";

test("provenance inventory keeps missing evidence explicit and never auto-approves", () => {
  const rows = buildProvenanceInventory({
    version: 1,
    skills: [
      { id: "unreviewed", name: "Unreviewed", category: "Testing", source: { type: "local", path: "../skills/unreviewed" }, license: "MIT" },
      { id: "reviewed", name: "Reviewed", category: "Testing", source: { type: "git", url: "https://example.com/repo", ref: "main" }, license: "MIT" }
    ]
  }, { version: 1, approvals: [] });
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.id, "reviewed");
  const unreviewed = rows.find(row => row.id === "unreviewed")!;
  assert.equal(unreviewed.approvalRecordPresent, false);
  assert.equal(unreviewed.redistributionAllowed, null);
  assert.ok(unreviewed.missingEvidence.includes("explicit redistribution permission"));
  assert.ok(unreviewed.missingEvidence.includes("upstreamRevision (full commit SHA)"));
  const git = rows.find(row => row.id === "reviewed")!;
  assert.equal(git.registrySourceUrl, "https://example.com/repo");
  assert.equal(git.registrySourceRef, "main");
  assert.ok(git.missingEvidence.includes("upstreamRevision (full commit SHA)"));
});

test("provenance inventory identifies complete evidence without substituting for the release gate", () => {
  const rows = buildProvenanceInventory({
    version: 1,
    skills: [{ id: "sample", name: "Sample", category: "Testing", source: { type: "local", path: "../skills/sample" }, license: "MIT" }]
  }, { version: 1, approvals: [{
    skillId: "sample",
    upstreamUrl: "https://example.com/repo",
    upstreamRevision: "0123456789abcdef0123456789abcdef01234567",
    license: "MIT",
    licenseEvidenceUrl: "https://example.com/repo/blob/0123456789abcdef0123456789abcdef01234567/LICENSE",
    redistributionAllowed: true,
    reviewedAt: "2026-10-29",
    reviewer: "reviewer",
    notes: "Evidence reviewed for fixture test."
  }] });
  assert.deepEqual(rows[0]?.missingEvidence, []);
  assert.equal(rows[0]?.redistributionAllowed, true);
  assert.equal(rows[0]?.approvalRecordPresent, true);
});
