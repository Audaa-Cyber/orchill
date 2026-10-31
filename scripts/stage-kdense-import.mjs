// One-shot manual staging for K-Dense-AI/scientific-agent-skills.
//
// Engineering exception, documented in the import journal: the Skills CLI remote
// fetch (git clone, blobless shallow) of this repository repeatedly fails in this
// environment with `curl 56 schannel: server closed abruptly` / `early EOF`
// disconnects (repo is ~1GB+ of pack data; same failure occurs on direct
// `git clone`). The 177-skill set therefore cannot be staged through the normal
// `orchill import` -> `npx skills add` path from this network.
//
// This script stages the payloads from a locally cloned checkout of the same
// upstream repository and writes a registry-additions.json + report.json with the
// same schema as the bulk importer, using an honest provenance string that names
// the upstream repo. Integrity is established downstream by
// scripts/verify-upstream-provenance.mjs, which re-clones the canonical GitHub
// upstream itself and proves every bundled SKILL.md byte-identical (normalized
// SHA-256) at a pinned revision, plus full directory-manifest equality at HEAD.
//
// Usage: node scripts/stage-kdense-import.mjs <local-clone-path>
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const REPO = "K-Dense-AI/scientific-agent-skills";
const STAGING = ".orchill-uiux-import-kdense";
const FRONT_COMMENT = "Imported from " + REPO + "; the Skills CLI remote fetch of this repository failed repeatedly in this environment (curl 56 schannel early-EOF disconnects), so payloads were staged from a locally cloned checkout of the same upstream. Verify source, pin, and license before publishing.";

const clonePath = process.argv[2];
if (!clonePath) throw new Error("usage: node scripts/stage-kdense-import.mjs <local-clone-path>");
const skillsRoot = path.join(clonePath, "skills");
if (!existsSync(skillsRoot)) throw new Error(`no skills/ tree at ${skillsRoot}`);

const registry = JSON.parse(await readFile("registry/skills.json", "utf8"));

const slugify = (value) => {
  const id = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!id) throw new Error("Cannot create a safe ID from skill name: " + value);
  return id;
};
const frontmatter = (md) => {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/); const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const p = line.match(/^([a-zA-Z][\w-]*):\s*(.*?)\s*$/);
    if (p) out[p[1].toLowerCase()] = p[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
};

const existingIds = new Set(registry.skills.map(s => s.id));
const seen = new Set();
const entries = [];
const records = [];
let line = 0;

for (const dirName of (await readdir(skillsRoot)).sort()) {
  const dir = path.join(skillsRoot, dirName);
  const statDir = await readdir(dir).catch(() => null);
  if (!statDir || !statDir.includes("SKILL.md")) continue;
  line++;
  const md = await readFile(path.join(dir, "SKILL.md"), "utf8");
  const fm = frontmatter(md);
  const name = fm.name?.trim() || dirName;
  const id = slugify(name);
  if (seen.has(id)) throw new Error(`Duplicate generated skill ID within ${REPO}: ${id} (${dirName})`);
  if (existingIds.has(id)) throw new Error(`ID collision with the existing registry: ${id}`);
  seen.add(id);
  const licenseFound = statDir.some(n => /^(license|licence)(\.|$)/i.test(n));
  await mkdir(path.join(STAGING, "skills"), { recursive: true });
  await cp(dir, path.join(STAGING, "skills", id), { recursive: true });
  entries.push({
    id, name,
    description: fm.description?.trim() || "Description requires review; imported from " + REPO + ".",
    category: "UI/UX",
    source: { type: "local", path: "./skills/" + id },
    skillPath: ".",
    provenance: FRONT_COMMENT,
    targets: ["project", "claude", "codex", "agents"],
    ...(fm.license ? { license: fm.license } : {})
  });
  records.push({ line, command: `local-clone staging: ${dirName} from ${REPO}`, status: "imported", id, licenseFound,
    note: "staged manually from a local clone because the Skills CLI remote fetch of this repository fails in this environment" });
}

// Refuse partial staging: every upstream skill dir must stage.
const upstreamCount = (await readdir(skillsRoot)).filter(n => existsSync(path.join(skillsRoot, n, "SKILL.md"))).length;
if (records.length !== upstreamCount) throw new Error(`staged ${records.length}/${upstreamCount} upstream skills; refusing partial state`);

const report = { total: records.length, imported: records.length, failed: 0, records };
await writeFile(path.join(STAGING, "registry-additions.json"), JSON.stringify({ version: 1, skills: entries }, null, 2) + "\n");
await writeFile(path.join(STAGING, "report.json"), JSON.stringify(report, null, 2) + "\n");
await writeFile(path.join(STAGING, "report.md"), [
  "# K-Dense manual staging report", "",
  `Upstream: ${REPO} (local clone at ${clonePath})`, "",
  `Staged: ${records.length} skills -> ${STAGING}/skills/`,
  "",
  "Reason: the Skills CLI remote fetch of this repository fails repeatedly in this",
  "environment (curl 56 / early-EOF disconnects, also on direct git clone), so the",
  "normal `orchill import` -> `npx skills add` path could not stage these payloads.",
  "Integrity is established downstream by scripts/verify-upstream-provenance.mjs,",
  "which re-clones the canonical GitHub upstream and proves every bundled SKILL.md",
  "byte-identical at a pinned revision.", "",
  "Review every skill's instructions and metadata. License classification is done from",
  "the upstream license files captured by the verifier, not from frontmatter claims.", ""
].join("\n"));
console.log(`staged ${records.length} skills into ${STAGING}/skills/`);
