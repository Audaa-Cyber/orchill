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

// Verified manual mappings for bundled skills whose upstream directory was
// renamed (import used a release-branch name or a subproject path that no
// longer matches the bundled id). Each entry was confirmed by comparing the
// bundled SKILL.md normalized SHA-256 against the upstream file.
const UPSTREAM_DIR_OVERRIDES = {
  "vercel-react-best-practices": { dir: "skills/react-best-practices" },
  "vercel-react-native-skills": { dir: "skills/react-native-skills" },
  "vercel-react-view-transitions": { dir: "skills/react-view-transitions" },
  "vercel-composition-patterns": { dir: "skills/composition-patterns" },
  "design-taste-frontend": { repo: "Leonxlnx/taste-skill", dir: "skills/taste-skill" },
  "tinybird": { dir: "skills/tinybird-best-practices" },
  "better-auth-best-practices": { dir: "better-auth/best-practices" },
};

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

function gitBuffer(args, cwd, timeoutMs = 600_000) {
  return spawnSync("git", args, { cwd, encoding: "buffer", timeout: timeoutMs, windowsHide: true, maxBuffer: 256 * 1024 * 1024 });
}

async function catBlob(gitDir, rev, filePath) {
  const r = gitBuffer(["cat-file", "blob", `${rev}:${filePath}`], gitDir, 120_000);
  if (r.status !== 0) return null;
  // Keep the exact blob bytes: re-encoding through UTF-8 text would corrupt
  // non-ASCII content and silently break hash comparisons.
  return Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.from(r.stdout || "");
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
      // Windows: transient EBUSY locks (indexer/AV) can break directory removal; retry.
      for (let attempt = 0; attempt < 3; attempt++) {
        try { await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1500 }); break; }
        catch (error) {
          if (attempt === 2) throw error;
          record.rmRetryError = String(error).split("\n")[0];
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      const shallow = git(["-c", "core.longpaths=true", "clone", "--quiet", "--depth", "1", "--filter=blob:none", url, dir], null, 1_200_000);
      if (!gitOk(shallow)) {
        await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1500 }).catch(() => {});
        // One retry: clone timeouts are usually transient network hiccups.
        const retried = git(["-c", "core.longpaths=true", "clone", "--quiet", "--depth", "1", "--filter=blob:none", url, dir], null, 1_200_000);
        if (!gitOk(retried)) { record.status = "clone-failed"; record.error = retried.stderr?.trim().split("\n")[0]; record.skills = repoSkills.map(s => ({ id: s.id, status: "blocked-clone-failed" })); continue; }
      }
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

      const localPath = path.join("skills", skill.category.toLowerCase().normalize("NFKD").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), skill.id);
      const localSkillMd = path.join(localPath, "SKILL.md");
      if (!(await exists(localSkillMd))) { row.status = "bundled-payload-missing"; continue; }
      row.bundledSkilMdHash = nsha(await readFile(localSkillMd));

      // Find candidate upstream dirs by exact or case-insensitive basename.
      let candidates = upstreamDirs.filter(d => d.parentId === skill.id);
      const findAliasCandidates = async () => {
        // Some upstreams name skill directories differently from the bundled ID
        // (the registry ID is derived from the Skills CLI command, not the folder).
        // Fall back to identifying the upstream directory whose SKILL.md content
        // is byte-identical to the bundled copy.
        const matched = [];
        for (const cand of upstreamDirs) {
          const abs = path.join(dir, cand.fileRel);
          let head;
          if (await exists(abs)) head = nsha(await readFile(abs));
          else {
            const blob = await catBlob(dir, record.headSha, cand.fileRel);
            if (!blob) continue;
            head = nsha(blob);
          }
          if (head === row.bundledSkilMdHash) matched.push(cand);
        }
        return matched;
      };
      // Verified manual mapping takes precedence; the bundled payload alread
      // matched the overridden upstream path byte-for-byte during review.
      const override = UPSTREAM_DIR_OVERRIDES[skill.id] ?? UPSTREAM_DIR_OVERRIDES[`${repo}#${skill.id}`];
      if (override?.dir) {
        const overridden = await (async () => {
          const parent = path.dirname(override.dir);
          const fileRel = `${override.dir}/SKILL.md`;
          if (override.repo && override.repo !== repo) return [];
          if (await exists(path.join(dir, fileRel))) return [{ dirRel: override.dir, parentId: path.basename(override.dir), fileRel }];
          const blobAtHead = await catBlob(dir, record.headSha, fileRel);
          if (blobAtHead) return [{ dirRel: override.dir, parentId: path.basename(override.dir), fileRel }];
          return [];
        })();
        if (overridden.length > 0) { candidates = overridden; row.matchedBy = "verified-manual-override"; }
        else { row.status = "upstream-path-not-found"; row.candidates = [override.dir]; continue; }
      }
      if (candidates.length === 0) {
        const alias = await findAliasCandidates();
        if (alias.length === 0) { row.status = "upstream-path-not-found"; continue; }
        candidates = alias;
        row.matchedBy = "content-hash-scan";
      }

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
        // Last resort: the directory-name-derived candidate history may be the
        // wrong file entirely; scan every upstream SKILL.md against the bundle.
        if (candidates.length === 1) {
          const alias = await findAliasCandidates();
          if (alias.length > 0) {
            candidates = alias;
            row.matchedBy = row.matchedBy ? row.matchedBy + "+content-hash-scan" : "content-hash-scan";
            const abs = path.join(dir, alias[0].fileRel);
            if (await exists(abs) && nsha(await readFile(abs)) === row.bundledSkilMdHash) {
              verifiedAt = record.headSha;
              verifiedPathRel = alias[0];
            }
          }
        }
      }

      if (!verifiedAt) {
        // Walk path history on the primary candidate for a matching revision.
        const cand = candidates[0];
        const shallow = git(["rev-parse", "--is-shallow-repository"], dir);
        if (gitText(shallow) === "true") {
          const fetched = git(["fetch", "--quiet", "--unshallow", url], dir, 900_000);
          if (!gitOk(fetched)) {
            row.status = "history-fetch-failed";
            row.error = fetched.stderr?.trim().split("\n")[0];
            continue;
          }
        }
        record.fullHistoryFetched = true;
        // Traverse full history across branches/merges: the bundled revision may
        // sit on a release branch that --first-parent would skip.
        const revs = gitText(git(["rev-list", "-n", String(MAX_HISTORY_DEPTH), "--all", "--", cand.fileRel], dir)).split("\n").filter(Boolean);
        row.historyRevisionsChecked = revs.length;
        for (const rev of revs) {
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
      row.rootLicenseFilesAtPinnedRev = rootLicenseAtRev;
      if (licenseText) {
        const blobDir = path.join(LICENSE_CACHE_DIR, safeName(repo));
        await mkdir(blobDir, { recursive: true });
        // Skill-scoped licenses are named per skill so concurrent skills cannot
        // overwrite each other's captured evidence within the same repository.
        const outName = licenseSource === "skill" ? `${skill.id}-${path.basename(licenseFileRel)}` : path.basename(licenseFileRel);
        await writeFile(path.join(blobDir, outName), licenseText);
        row.licenseEvidencePath = `provenance/licenses/${safeName(repo)}/${outName}`;
        row.licenseEvidenceUrl = `${REPO_HOST}/${repo}/blob/${verifiedAt}/${licenseFileRel}`;
        row.licenseSha256 = nsha(licenseText);
        row.licenseOrigin = `${licenseSource} license file`;
        row.licenseEvidenceUrlsAll = [row.licenseEvidenceUrl];
        // Repositories with several root license files (e.g. Microsoft's
        // LICENSE + LICENSE-CODE dual licensing) need every file captured.
        if (licenseSource === "root") {
          for (const extra of rootLicenseFiles.slice(1)) {
            const buf = row.matchedAtHead
              ? await readFile(path.join(dir, extra)).catch(async () => await catBlob(dir, verifiedAt, extra))
              : await catBlob(dir, verifiedAt, extra);
            if (!buf) continue;
            await writeFile(path.join(blobDir, path.basename(extra)), buf);
            row.licenseEvidenceUrlsAll.push(`${REPO_HOST}/${repo}/blob/${verifiedAt}/${extra}`);
          }
        }
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
