// One-shot integration of the .orchill-uiux-import staging runs into the main registry.
//
// Takes the staged payloads and registry additions produced by parallel
//   orchill import .orchill-probe\<chunk>.txt -c "UI/UX" -o .orchill-uiux-import-<chunk>
// runs, moves every staged payload into the canonical skills/ui-ux/ tree, rewrites the
// relative source paths so they point at the canonical location, resolves a known
// id collision with the catalogue's existing obra/superpowers test-driven-development
// skill, and appends the entries to registry/skills.json.
//
// This script does NOT approve licenses or write the release ledgers; that remains
// the job of verify-upstream-provenance.mjs + build-release-ledger.mjs.
import { cp, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const STAGING_ROOTS = process.argv.slice(2);
if (STAGING_ROOTS.length === 0) throw new Error("pass at least one staging output directory");
const CATEGORY_DIR = "skills/ui-ux";

const registry = JSON.parse(await readFile("registry/skills.json", "utf8"));
const existingIds = new Set(registry.skills.map(s => s.id));

// Known collision: the catalogue already ships test-driven-development from
// obra/superpowers. addyosmani/agent-skills ships a different skill with the same
// slugified name, so it is registered under a repo-distinct id.
const ID_RENAMES = new Map([["test-driven-development", "test-driven-development-addyosmani"]]);

const stagedIds = new Set();
let totalCommands = 0, failures = 0;
for (const STAGING of STAGING_ROOTS) {
  const report = JSON.parse(await readFile(path.join(STAGING, "report.json"), "utf8"));
  const imports = report.records.filter(r => r.status === "imported");
  const failed = report.records.filter(r => r.status !== "imported");
  totalCommands += report.records.length;
  failures += failed.length;
  if (report.imported !== imports.length) throw new Error(`${STAGING}: report summary mismatch`);
  console.log(`${STAGING}: ${imports.length} imported, ${failed.length} failed of ${report.records.length} commands.`);
  for (const f of failed) console.log(`  FAILED line ${f.line}: ${f.command}${f.error ? " - " + f.error : ""}`);
  for (const r of imports) {
    if (stagedIds.has(r.id)) throw new Error(`duplicate staged id across runs: ${r.id}`);
    stagedIds.add(r.id);
  }
}

let added = 0;
for (const STAGING of STAGING_ROOTS) {
  const additions = JSON.parse(await readFile(path.join(STAGING, "registry-additions.json"), "utf8"));
  for (const entry of additions.skills) {
    if (!stagedIds.has(entry.id)) throw new Error(`registry-additions entry without an 'imported' staging record: ${entry.id}`);
    const finalId = ID_RENAMES.get(entry.id) ?? entry.id;
    if (existingIds.has(finalId)) throw new Error(`id collision after rename: ${finalId}`);

    const stagedDir = path.join(STAGING, "skills", entry.id);
    const destDir = path.join(CATEGORY_DIR, finalId);
    const destRel = `${CATEGORY_DIR}/${finalId}`;
    if (existsSync(destDir)) throw new Error(`payload destination already exists: ${destDir}`);
    await cp(stagedDir, destDir, { recursive: true });

    const files = await readdir(destDir);
    if (!files.includes("SKILL.md")) throw new Error(`staged payload for ${finalId} has no SKILL.md`);

    if (finalId !== entry.id) {
      entry.id = finalId;
      entry.name = entry.name ?? finalId;
    }
    entry.source = { type: "local", path: `../${destRel}` };
    entry.skillPath = ".";
    registry.skills.push(entry);
    added++;
  }
}

if (added !== stagedIds.size) throw new Error(`merged ${added} of ${stagedIds.size} staged payloads; refuses ambiguous state`);

// Preserve the import staging evidence in place; only the payload copies move out.
for (const STAGING of STAGING_ROOTS) {
  await rename(path.join(STAGING, "skills"), path.join(STAGING, "skills-imported"));
}

await writeFile("registry/skills.json", JSON.stringify(registry, null, 2) + "\n");
console.log(`Registered ${added} skills under category UI/UX -> ${CATEGORY_DIR}/.`);
console.log("Next: node scripts/verify-upstream-provenance.mjs, then node scripts/build-release-ledger.mjs.");
