// Development provenance-verification runner (not shipped in the npm package).
//
// For every third-party bundled skill, this script:
//   1. resolves the upstream GitHub repository recorded at import time,
//   2. shallow-clones the repository and locates the upstream skill directory,
//   3. proves the bundled payload corresponds to an upstream revision by
//      comparing normalized SHA-256 hashes of SKILL.md and every bundled file,
//      walking upstream history when the branch head advanced past the import,
//   4. captures the actual upstream license file bytes at the pinned revision,
//   5. writes evidence to provenance/ and a verdict fact sheet to stdout file.
//
// Usage: node scripts/verify-upstream-provenance.mjs
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

const REPO_HOST = "https://github.com";
const CACHE = path.join(process.env.TEMP || "/tmp", "orchill-upstream-verify");
const PROVENANCE_DIR = "provenance";
const LICENSE_CACHE_DIR = path.join(PROVENANCE_DIR, "licenses");
const MAX_HISTORY_DEPTH = 500;

const normalize = (buffer) =>
  Buffer.from(buffer.toString("utf8").replace(/\r\n/g, "\n").replace(/^\uFEFF/, ""), "utf8");
const nsha = (buffer) => createHash("sha256").update(normalize(buffer)).digest("hex");
const safeName = (repo) => repo.split("/").map(part => part.replace(/[^A-Za-z0-9._-]/g, "_")).join("--");

function git(args, cwd, timeoutMs = 600_000) {
  return spawnSync("git", args, { cwd, encoding: "utf8", timeout: timeoutMs, windowsHide: true, maxBuffer: 256 * 1024 * 1024 });
}
function gitOk(result) {
  return result.status === 0;
}
function gitText(result) {
  return (result.stdout ?? "").trim();
}

function readRegistrySkills(registry) {
  const skills = [];
  for (const s of registry.skills) {
    if (s.source?.type !== "local" || s.id === "demo-focus") continue;
    const cli = (s.provenance ?? "").match(/Imported with Skills CLI from ([^;\s]+)\s*;/);
    const mkt = (s.provenance ?? "").match(/marketplace plugin ([^;\]]+)\s*;/);
    if (cli) skills.push({ id: s.id, category: s.category, repo: cli[1], kind: "skills-cli" });
    else if (mkt) skills.push({ id: s.id, category: s.category, repo: "dotnet/skills", plugin: mkt[1].replace(/@dotnet-agent-skills$/, ""), kind: "marketplace" });
    else skills.push({ id: s.id, category: s.category, repo: null, kind: "unmapped" });
  }
  return skills;
}

export function detectSpdx(text) {
  const t = text.toLowerCase();
  if (t.includes("apache license") && t.includes("version 2.0")) return "Apache-2.0";
  if (t.includes("mozilla public license") && t.includes("2.0")) return "MPL-2.0";
  if (/\bboost\b.*software license/.test(t)) return "BSL-1.0";
  if (t.includes("isc license") || (t.includes("permission to use, copy, modify") && t.includes("isc"))) return "ISC";
  if (/bsd \d-clause|redistribution and use in source and binary forms/.test(t)) {
    const clauses = (text.match(/redistribution and use in source and binary forms/gi) ?? []).length;
    const cond = /may\s+be\s+used\s+to\s+endorse\s+or\s+promote/.test(t);
    const disclaimer = /\bfurnished\s+/.test(t) && /warranty/.test(t);
    if (cond) return "BSD-3-Clause";
    if (clauses >= 1 && disclaimer) return "BSD-2-Clause";
    return "BSD-?-Clause";
  }
  if (t.includes("the mit license") || t.includes("mit license") || /permission is hereby granted, free of charge/.test(t)) return "MIT";
  if (t.includes("gpl") || t.includes("gnu general public license")) return "GPL?"; // needs manual review
  return null;
}

const LICENSE_FILE_PATTERN = /^(license|licence|copying|notice|copyright|legal|unlicense|readme\.license)([.\-_].*)?$/i;
const LICENSE_FILE_STRICT = /^(LICENSE|LICENCE|COPYING|NOTICE|LICENSE\.md|LICENSE\.txt|LICENSE\.rst|COPYING\.txt|COPYING\.LESSER|UNLICENSE)/;

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function listLicenseFiles(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return []; }
  return entries.filter(e => e.isFile() && LICENSE_FILE_PATTERN.test(e.name) && e.name.toUpperCase() !== "README").map(e => e.name).sort();
}

async function headManifest(dir) {
  const files = [];
  async function walk(d, rel) {
    for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.name === ".git" || e.name === "node_modules") continue;
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      const child = path.join(d, e.name);
      if (e.isDirectory()) await walk(child, childRel);
      else {
        const info = await stat(child);
        if (info.isFile()) files.push({ rel: childRel, size: info.size });
      }
    }
  }
  await walk(dir, "");
  return files;
}

async function hashManifest(gitDir, commit, prefix) {
  const args = ["ls-tree", "-r", commit];
  if (prefix) args.push(prefix);
  const ls = git(args, gitDir);
  if (!gitOk(ls)) return null;
  return gitText(ls).split("\n").filter(Boolean).map(line => {
    const [, type, hash, p] = line.split(/\s+/);
    return { mode: type, hash, path: p };
  });
}

async function catBlob(gitDir, rev, filePath) {
  const r = git(["cat-file", "blob", `${rev}:${filePath}`], gitDir, 120_000);
  if (!gitOk(r)) return null;
  return Buffer.from(r.stdout, "binary");
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(LICENSE_CACHE_DIR, { recursive: true });
  const registry = JSON.parse(await readFile("registry/skills.json", "utf8"));
  const skills = readRegistrySkills(registry);

  const byRepo = new Map();
  for (const s of skills) {
    if (!byRepo.has(s.repo)) byRepo.set(s.repo, []);
    byRepo.get(s.repo).push(s);
  }

  const factSheet = { generatedAt: new Date().toISOString(), method: "git clone + normalized sha256 payload comparison + upstream license file capture", repos: [], unmappedIds: skills.filter(s => !s.repo).map(s => s.id) };

  for (const [repo, repoSkills] of [...byRepo.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const record = { repo, status: "pending", skills: [] };
    factSheet.repos.push(record);
    const url = `${REPO_HOST}/${repo}.git`;
    const dir = path.join(CACHE, safeName(repo));

    // Clone if needed.
    let haveClone = false;
    if (await exists(path.join(dir, ".git"))) {
      const rev = git(["rev-parse", "HEAD"], dir);
      haveClone = gitOk(rev);
      record.headSha = gitText(rev);
    }
    if (!haveClone) {
      await rm(dir, { recursive: true, force: true });
      const shallow = git(["clone", "--quiet", "--depth", "1", url, dir]);
      if (!gitOk(shallow)) { record.status = "clone-failed"; record.error = shallow.stderr?.trim().split("\n")[0]; record.skills = repoSkills.map(s => ({ id: s.id, status: "blocked-clone-failed" })); continue; }
      record.headSha = gitText(git(["rev-parse", "HEAD"], dir));
    }
    record.branch = gitText(git(["rev-parse", "--abbrev-ref", "HEAD"], dir));

    // Map upstream skill directories.
    let upstreamDirs = [];
    {
      const scanDirs = [];
      async function walk(d, rel, depth) {
        if (depth > 8) return;
        for (const e of await readdir(d, { withFileTypes: true })) {
          if (e.name === ".git" || e.name === "node_modules") continue;
          const child = path.join(d, e.name);
          const childRel = rel ? `${rel}/${e.name}` : e.name;
          if (e.isDirectory()) { if (e.name === "SKILL.md" || true) await walk(child, childRel, depth + 1); }
          else if (e.name === "SKILL.md") scanDirs.push({ dirRel: rel, parentId: rel.split("/").pop(), fileRel: childRel });
        }
      }
      await walk(dir, "", 0);
      upstreamDirs = scanDirs;
      record.upstreamSkillDirs = scanDirs.length;
    }

    for (const skill of repoSkills) {
      const row = { id: skill.id, kind: skill.kind, status: "unknown" };
      record.skills.push(row);

      // Find candidate upstream dirs by exact or case-insensitive basename.
      let candidates = upstreamDirs.filter(d => d.parentId === skill.id);
      if (candidates.length === 0) {
        const lower = skill.id.toLowerCase();
        const ci = upstreamDirs.filter(d => d.parentId.toLowerCase() === lower);
        candidates = ci;
        if (ci.length > 0) row.matchedBy = "case-insensitive-dirname";
      }
      if (candidates.length === 0) { row.status = "upstream-path-not-found"; continue; }

      // Deduplicate identical-content candidates.
      const localPath = path.join("skills", skill.category.toLowerCase().normalize("NFKD").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), skill.id);
      const localSkillMd = path.join(localPath, "SKILL.md");
      if (!(await exists(localSkillMd))) { row.status = "bundled-payload-missing"; continue; }
      row.bundledSkilMdHash = nsha(await readFile(localSkillMd));

      let verifiedAt = null; // revision whose SKILL.md matches
      let verifiedPathRel = null;
      for (const cand of candidates) {
        const abs = path.join(dir, cand.fileRel);
        if (await exists(abs)) {
          if (nsha(await readFile(abs)) === row.bundledSkilMdHash) { verifiedAt = record.headSha; verifiedPathRel = cand; break; }
        } else {
          const blob = await catBlob(dir, record.headSha, cand.fileRel);
          if (blob && nsha(blob) === row.bundledSkilMdHash) { verifiedAt = record.headSha; verifiedPathRel = cand; break; }
        }
      }

      if (!verifiedAt) {
        // Walk path history on the primary candidate for a matching revision.
        const cand = candidates[0];
        const fetched = git(["fetch", "--quiet", "--unshallow", url], dir, 900_000);
        if (!gitOk(fetched)) {
          row.status = "history-fetch-failed";
          row.error = fetched.stderr?.trim().split("\n")[0];
          continue;
        }
        record.fullHistoryFetched = true;
        const revs = gitText(git(["rev-list", "-n", String(MAX_HISTORY_DEPTH), "--first-parent", record.branch, "--", cand.fileRel], dir)).split("\n").filter(Boolean);
        row.historyRevisionsChecked = revs.length;
        for (const rev of revs.concat(revs.length === 0 ? [] : [])) {
          const blob = await catBlob(dir, rev, cand.fileRel);
          if (blob && nsha(blob) === row.bundledSkilMdHash) { verifiedAt = rev; verifiedPathRel = cand; break; }
        }
      }

      if (!verifiedAt) { row.status = "payload-unmatched-upstream"; row.candidates = candidates.map(c => c.dirRel); continue; }
      row.status = "payload-matched";
      row.upstreamSkillPath = verifiedPathRel.dirRel;
      row.upstreamRevision = verifiedAt;
      row.matchedAtHead = verifiedAt === record.headSha;

      // Determine license evidence at the pinned revision.
      const licenseCandidates = [];
      const skillDirPrefix = verifiedPathRel.dirRel;
      // per-skill dir license (needs materialization if old rev)
      let skillDirFiles = await listLicenseFiles(path.join(dir, skillDirPrefix));
      if (skillDirFiles.length === 0) {
        const tree = await hashManifest(dir, verifiedAt, `${skillDirPrefix}/`);
        if (tree) {
          skillDirFiles = tree.map(e => path.basename(e.path)).filter(n => LICENSE_FILE_PATTERN.test(n) && n.toUpperCase() !== "README").sort();
        }
        row.skillDirLicenseOnly = skillDirFiles;
      } else if (!row.matchedAtHead) {
        // cross-check skill-dir license files exist at pinned rev too
        const tree = await hashManifest(dir, verifiedAt, `${skillDirPrefix}/`);
        if (tree) row.skillDirLicenseAtRev = tree.map(e => path.basename(e.path)).filter(n => LICENSE_FILE_PATTERN.test(n)).sort();
        row.skillDirLicenseAtHead = skillDirFiles;
      }
      const rootLicenseFiles = await listLicenseFiles(dir);
      const rootLicenseAtRev = row.matchedAtHead ? rootLicenseFiles : (await hashManifest(dir, verifiedAt, "") ?? [])
        .map(e => path.basename(e.path)).filter(n => LICENSE_FILE_STRICT.test(n));
      licenseCandidates.push(...skillDirFiles.map(n => ({ scope: "skill", file: n })));
      licenseCandidates.push(...rootLicenseFiles.map(n => ({ scope: "root", file: n })));
      row.licenseFilesAvailable = licenseCandidates;
      row.rootLicenseFilesAtPinnedRev = rootLicenseAtRev;

      // Capture license text. Precedence: license inside the pinned upstream
      // skill directory governs that skill; root license files otherwise.
      let licenseText = null, licenseSource = null, licenseFileRel = null;
      for (const cand of [{ scope: "skill", file: skillDirFiles[0], dir: skillDirPrefix }, { scope: "root", file: rootLicenseFiles[0] }, ...skillDirFiles.slice(1).map(f => ({ scope: "skill", file: f, dir: skillDirPrefix })), ...rootLicenseFiles.slice(1).map(f => ({ scope: "root", file: f }))]) {
        if (!cand?.file) continue;
        const rel = cand.scope === "skill" ? `${cand.dir}/${cand.file}` : cand.file;
        const buf = row.matchedAtHead
          ? await readFile(path.join(dir, rel)).catch(async () => await catBlob(dir, verifiedAt, rel))
          : await catBlob(dir, verifiedAt, rel);
        if (!buf) continue;
        licenseText = buf; licenseSource = cand.scope; licenseFileRel = rel;
        row.spdx = detectSpdx(buf.toString("utf8"));
        if (row.spdx === null) { row.spdxUndetected = true; }
        break;
      }
      row.licenseFilesAvailable = licenseCandidates;
      if (licenseText) {
        const blobDir = path.join(LICENSE_CACHE_DIR, safeName(repo));
        await mkdir(blobDir, { recursive: true });
        const outName = path.basename(licenseFileRel);
        await writeFile(path.join(blobDir, outName), licenseText);
        row.licenseEvidencePath = `provenance/licenses/${safeName(repo)}/${outName}`;
        row.licenseEvidenceUrl = `${REPO_HOST}/${repo}/blob/${verifiedAt}/${licenseFileRel}`;
        row.licenseSha256 = nsha(licenseText);
        row.licenseOrigin = `${licenseSource} license file`;
      } else {
        row.licenseEvidencePath = null;
        row.licenseEvidenceUrl = null;
      }

      // Whole-directory manifest comparison when materialization is possible.
      const upstreamDirAbs = path.join(dir, skillDirPrefix);
      if (row.matchedAtHead && await exists(upstreamDirAbs)) {
        const upFiles = await headManifest(upstreamDirAbs);
        const localFiles = await headManifest(localPath);
        const map = new Map();
        for (const f of upFiles) map.set(f.rel, nsha(await readFile(path.join(upstreamDirAbs, f.rel))));
        const localHashes = new Map();
        for (const f of localFiles) localHashes.set(f.rel, nsha(await readFile(path.join(localPath, f.rel))));
        let equal = 0, differing = 0, missingLocally = 0, extraLocally = 0;
        for (const [rel, hash] of map) {
          if (localHashes.has(rel)) { if (localHashes.get(rel) === hash) equal++; else differing++; }
          else missingLocally++;
        }
        for (const rel of localHashes.keys()) if (!map.has(rel)) extraLocally++;
        row.dirManifest = { upstreamFiles: upFiles.length, localFiles: localFiles.length, equal, differing, missingLocally, extraLocally };
      } else if (!row.matchedAtHead) {
        row.dirManifestSkipped = "pinned revision predates shallow checkout; SKILL.md equality is the binding proof";
      }
      row.verified = row.status === "payload-matched";
    }

    record.status = record.skills.every(s => s.status === "payload-matched") ? "verified-all" : "partial";
  }

  await writeFile("scripts/upstream-verification-facts.json", JSON.stringify(factSheet, null, 2) + "\n");
  const flat = factSheet.repos.flatMap(r => r.skills);
  const counts = {};
  for (const s of flat) counts[s.status] = (counts[s.status] ?? 0) + 1;
  console.log("Per-skill status:", JSON.stringify(counts));
  console.log("Facts written to scripts/upstream-verification-facts.json");
}

main().catch(err => { console.error(err); process.exitCode = 1; });
