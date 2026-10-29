import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import test from "node:test";

const checker = fileURLToPath(new URL("../scripts/check-release-readiness.ts", import.meta.url));
const require = createRequire(import.meta.url);
// Node's --import option expects a URL on Windows; a raw C:\\ path is parsed as scheme "c:".
const tsxLoader = pathToFileURL(require.resolve("tsx")).href;

async function fixture(approvals: unknown, skills = [{ id: "example-skill", name: "Example", description: "Fixture", category: "Testing", skillPath: ".", source: { type: "local", path: "../skills/example-skill" }, license: "MIT" }]) {
  const root = await mkdtemp(path.join(os.tmpdir(), "orchill-release-check-"));
  await mkdir(path.join(root, "registry"));
  await writeFile(path.join(root, "registry", "skills.json"), JSON.stringify({
    version: 1,
    skills
  }));
  await writeFile(path.join(root, "registry", "release-approvals.json"), JSON.stringify(approvals));
  return root;
}

test("release check does not count incomplete approval records as approved", async () => {
  const root = await fixture({ version: 1, approvals: [{
    skillId: "example-skill",
    upstreamUrl: "https://example.com/repo",
    upstreamRevision: "not-a-commit",
    license: "MIT",
    licenseEvidenceUrl: "https://example.com/license",
    redistributionAllowed: true,
    reviewedAt: "2026-02-31",
    reviewer: "test",
    notes: "Fixture only; not evidence."
  }] });
  try {
    const result = spawnSync(process.execPath, ["--import", tsxLoader, checker], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout) as { summary: { approved: number; blockers: number }; blockers: string[] };
    assert.equal(report.summary.approved, 0);
    assert.ok(report.summary.blockers >= 2);
    assert.ok(report.blockers.some(item => item.includes("immutable 40- or 64-character")));
    assert.ok(report.blockers.some(item => item.includes("real ISO date")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("strict release check exits nonzero when approval evidence is missing", async () => {
  const root = await fixture({ version: 1, approvals: [] });
  try {
    const result = spawnSync(process.execPath, ["--import", tsxLoader, checker, "--strict"], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Release blocked/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("strict release check accepts pinned remote skills without bundled redistribution approvals", async () => {
  const root = await fixture({ version: 1, approvals: [] }, [{
    id: "remote-skill", name: "Remote", description: "Pinned upstream source", category: "Testing", skillPath: "skills/remote-skill",
    source: { type: "git", url: "https://github.com/example/skills.git", ref: "0123456789abcdef0123456789abcdef01234567" },
    license: "Apache-2.0", licenseEvidenceUrl: "https://github.com/example/skills/blob/0123456789abcdef0123456789abcdef01234567/skills/remote-skill/LICENSE.txt"
  }]);
  try {
    const result = spawnSync(process.execPath, ["--import", tsxLoader, checker, "--strict"], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout) as { summary: { bundledSkills: number; remoteSources: number; blockers: number } };
    assert.equal(report.summary.bundledSkills, 0);
    assert.equal(report.summary.remoteSources, 1);
    assert.equal(report.summary.blockers, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("strict release check blocks remote skills without an immutable upstream ref", async () => {
  const root = await fixture({ version: 1, approvals: [] }, [{
    id: "remote-skill", name: "Remote", description: "Unpinned source", category: "Testing", skillPath: "skills/remote-skill",
    source: { type: "git", url: "https://github.com/example/skills.git", ref: "main" },
    license: "Apache-2.0", licenseEvidenceUrl: "https://github.com/example/skills/blob/main/skills/remote-skill/LICENSE.txt"
  }]);
  try {
    const result = spawnSync(process.execPath, ["--import", tsxLoader, checker, "--strict"], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /immutable 40- or 64-character Git commit hash/);
  } finally { await rm(root, { recursive: true, force: true }); }
});


test("strict release check does not demand third-party approval for the explicit first-party demo example", async () => {
  const root = await fixture({ version: 1, approvals: [] }, [{
    id: "demo-focus", name: "Demo Focus", description: "First-party example", category: "Examples",
    skillPath: ".", source: { type: "local", path: "../skills/examples/demo-focus" },
    license: "MIT", provenance: "Bundled Orchill example; not a third-party skill."
  }]);
  try {
    const result = spawnSync(process.execPath, ["--import", tsxLoader, checker, "--strict"], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout) as { summary: { approved: number; firstPartyExamples: number; blockers: number } };
    assert.equal(report.summary.approved, 1);
    assert.equal(report.summary.firstPartyExamples, 1);
    assert.equal(report.summary.blockers, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
