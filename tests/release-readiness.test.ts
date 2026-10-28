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

async function fixture(approvals: unknown) {
  const root = await mkdtemp(path.join(os.tmpdir(), "orchill-release-check-"));
  await mkdir(path.join(root, "registry"));
  await writeFile(path.join(root, "registry", "skills.json"), JSON.stringify({
    version: 1,
    skills: [{ id: "example-skill", name: "Example", description: "Fixture", category: "Testing", skillPath: ".", source: { type: "local", path: "../skills/example-skill" }, license: "MIT" }]
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
