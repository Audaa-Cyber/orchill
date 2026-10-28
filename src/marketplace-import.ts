import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

export type MarketplaceCommand =
  | { kind: "marketplace"; line: number; repo: string; original: string }
  | { kind: "plugin"; line: number; plugin: string; marketplace: string; original: string };

export interface MarketplaceRecord {
  line: number;
  command: string;
  status: "imported" | "failed" | "preview";
  ids?: string[];
  error?: string;
}

const safeName = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const safeRepo = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

export function parseMarketplaceCommand(text: string, line: number): MarketplaceCommand {
  const value = text.trim();
  let m = value.match(/^\/plugin\s+marketplace\s+add\s+([^\s]+)$/);
  if (m?.[1]) {
    if (!safeRepo.test(m[1])) throw new Error("Marketplace must be an owner/repo GitHub shorthand.");
    return { kind: "marketplace", line, repo: m[1], original: value };
  }
  m = value.match(/^\/plugin\s+install\s+([a-zA-Z0-9][a-zA-Z0-9._-]*)@([a-zA-Z0-9][a-zA-Z0-9._-]*)$/);
  if (m?.[1] && m[2]) return { kind: "plugin", line, plugin: m[1], marketplace: m[2], original: value };
  throw new Error("Expected /plugin marketplace add owner/repo or /plugin install plugin@marketplace.");
}

function runGit(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { cwd, stdio: "inherit", windowsHide: true, shell: false });
    child.once("error", reject);
    child.once("close", code => code === 0 ? resolve() : reject(new Error("git exited with code " + code)));
  });
}

async function noSymlinks(dir: string): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const stat = await lstat(full);
    if (stat.isSymbolicLink()) throw new Error("Plugin skill contains a symlink: " + full);
    if (stat.isDirectory()) await noSymlinks(full);
  }
}

async function findSkillDirs(root: string): Promise<string[]> {
  const found: string[] = [];
  async function walk(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const stat = await lstat(full);
      if (stat.isSymbolicLink()) throw new Error("Marketplace repository contains a symlink: " + full);
      if (!stat.isDirectory()) continue;
      try {
        const skill = await lstat(path.join(full, "SKILL.md"));
        if (skill.isFile() && !skill.isSymbolicLink()) { found.push(full); continue; }
      } catch {}
      await walk(full);
    }
  }
  await walk(root);
  return found;
}

function frontmatter(markdown: string): Record<string, string> {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const out: Record<string, string> = {};
  if (!match?.[1]) return out;
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([a-zA-Z][\w-]*):\s*(.*?)\s*$/);
    if (pair?.[1] && pair[2] !== undefined) out[pair[1].toLowerCase()] = pair[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}
function slugify(value: string): string {
  const id = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!id) throw new Error("Cannot create a safe ID from skill name: " + value);
  return id;
}

export function parseMarketplaceCommands(input: string): Array<{ command: MarketplaceCommand; error?: string }> {
  return input.split(/\r?\n/).map((raw, index) => ({ raw: raw.trim(), line: index + 1 }))
    .filter(item => item.raw && !item.raw.startsWith("#"))
    .map(item => {
      try { return { command: parseMarketplaceCommand(item.raw, item.line) }; }
      catch (error) {
        return { command: { kind: "marketplace", line: item.line, repo: "", original: item.raw } as MarketplaceCommand,
          error: error instanceof Error ? error.message : String(error) };
      }
    });
}

export async function runMarketplaceImport(inputFile: string, outputPath: string, category: string, dryRun = false): Promise<MarketplaceRecord[]> {
  const input = await readFile(path.resolve(inputFile), "utf8");
  const parsed = parseMarketplaceCommands(input);
  if (!parsed.length) throw new Error("No marketplace commands found in " + inputFile);
  const records: MarketplaceRecord[] = [];
  for (const item of parsed) {
    const cmd = item.command;
    if (item.error) { records.push({ line: cmd.line, command: cmd.original, status: "failed", error: item.error }); continue; }
    if (cmd.kind === "marketplace" && dryRun) {
      records.push({ line: cmd.line, command: cmd.original, status: "preview" });
    }
  }
  const plugins = parsed.filter(item => !item.error && item.command.kind === "plugin");
  if (dryRun) {
    for (const item of plugins) {
      const cmd = item.command as Extract<MarketplaceCommand, { kind: "plugin" }>;
      const hasMarketplace = parsed.some(p => !p.error && p.command.kind === "marketplace");
      records.push({ line: cmd.line, command: cmd.original, status: hasMarketplace ? "preview" : "failed", ...(hasMarketplace ? {} : { error: "Add a marketplace before installing a plugin." }) });
    }
    for (const record of records) console.log((record.status === "failed" ? "FAIL " : "OK ") + record.command + (record.error ? " — " + record.error : ""));
    return records.sort((a, b) => a.line - b.line);
  }

  const output = path.resolve(outputPath);
  try { await lstat(output); throw new Error("Output already exists; choose a new directory: " + output); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  await mkdir(path.join(output, "skills"), { recursive: true });
  const staged: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "orchill-marketplaces-"));
  try {
    const repos = new Map<string, { path: string; alias: string }>();
    for (const item of parsed) {
      if (item.error || item.command.kind !== "marketplace") continue;
      const cmd = item.command;
      try {
        const repoPath = path.join(tempRoot, "repo-" + repos.size);
        const url = "https://github.com/" + cmd.repo + ".git";
        await runGit(["clone", "--depth", "1", "--", url, repoPath], tempRoot);
        const manifestPath = path.join(repoPath, ".agents", "plugins", "marketplace.json");
        let manifest: { name?: string; plugins?: Array<{ name?: string; source?: string; description?: string }> };
        try { manifest = JSON.parse(await readFile(manifestPath, "utf8")) as typeof manifest; }
        catch { throw new Error("Marketplace manifest not found at .agents/plugins/marketplace.json."); }
        if (!manifest.name || !Array.isArray(manifest.plugins)) throw new Error("Marketplace manifest has no valid name/plugins list.");
        repos.set(manifest.name, { path: repoPath, alias: manifest.name });
        records.push({ line: cmd.line, command: cmd.original, status: "imported" });
        console.log("Registered marketplace source " + cmd.repo + " as " + manifest.name + " (local staging only).");
      } catch (error) {
        records.push({ line: cmd.line, command: cmd.original, status: "failed", error: error instanceof Error ? error.message : String(error) });
      }
    }
    for (const item of plugins) {
      const cmd = item.command as Extract<MarketplaceCommand, { kind: "plugin" }>;
      try {
        const marketplace = repos.get(cmd.marketplace);
        if (!marketplace) throw new Error("Marketplace " + cmd.marketplace + " was not resolved. Use the exact marketplace name declared in its manifest.");
        const manifest = JSON.parse(await readFile(path.join(marketplace.path, ".agents", "plugins", "marketplace.json"), "utf8")) as { plugins?: Array<{ name?: string; source?: string; description?: string }> };
        const plugin = manifest.plugins?.find(p => p.name === cmd.plugin);
        if (!plugin?.source || !plugin.source.startsWith("./plugins/") || plugin.source.includes("..")) throw new Error("Plugin not found in marketplace manifest: " + cmd.plugin);
        const pluginRoot = path.resolve(marketplace.path, plugin.source);
        const skillDirs = await findSkillDirs(pluginRoot);
        if (!skillDirs.length) throw new Error("Plugin has no SKILL.md directories: " + cmd.plugin);
        const ids: string[] = [];
        for (const dir of skillDirs) {
          await noSymlinks(dir);
          const markdown = await readFile(path.join(dir, "SKILL.md"), "utf8");
          const fm = frontmatter(markdown);
          const name = fm.name?.trim() || path.basename(dir);
          const id = slugify(name);
          if (seen.has(id)) throw new Error("Duplicate generated skill ID: " + id);
          seen.add(id);
          const dest = path.join(output, "skills", id);
          await cp(dir, dest, { recursive: true, errorOnExist: true, force: false });
          const licenseFound = (await readdir(dest)).some(n => /^(license|licence)(\.|$)/i.test(n));
          const entry: Record<string, unknown> = {
            id, name, description: fm.description?.trim() || plugin.description || "Description requires review.",
            category, source: { type: "local", path: "./skills/" + id }, skillPath: ".",
            provenance: "Imported from marketplace plugin " + cmd.plugin + "@" + cmd.marketplace + "; review upstream source, commit, and license before publishing.",
            targets: ["project", "claude", "codex", "agents"]
          };
          if (fm.license) entry.license = fm.license;
          staged.push(entry); ids.push(id);
          console.log("STAGED " + id + (licenseFound ? " (license file present; verify terms)" : " (no root license file found)"));
        }
        records.push({ line: cmd.line, command: cmd.original, status: "imported", ids });
      } catch (error) {
        records.push({ line: cmd.line, command: cmd.original, status: "failed", error: error instanceof Error ? error.message : String(error) });
      }
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
  }
  await writeFile(path.join(output, "registry-additions.json"), JSON.stringify({ version: 1, skills: staged }, null, 2) + "\n", { flag: "wx" });
  await writeFile(path.join(output, "report.json"), JSON.stringify({ total: records.length, imported: records.filter(r => r.status === "imported").length, failed: records.filter(r => r.status === "failed").length, records }, null, 2) + "\n", { flag: "wx" });
  await writeFile(path.join(output, "report.md"), ["# Orchill marketplace import report", "", ...records.sort((a,b)=>a.line-b.line).map(r => "- " + r.status.toUpperCase() + " line " + r.line + ": " + r.command + (r.ids?.length ? " → " + r.ids.join(", ") : "") + (r.error ? " — " + r.error : "")), "", "Review plugin instructions, scripts, provenance, and licensing before publishing. Marketplace registration is recorded only for this import run; Orchill does not change your agent's global plugin configuration.", ""].join("\n"), { flag: "wx" });
  if (records.some(r => r.status === "failed")) process.exitCode = 1;
  return records.sort((a,b)=>a.line-b.line);
}
