#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { loadRegistry, defaultRegistryPath } from "./registry.js";
import { installSkill, targetRoot, uninstallSkill, verifySkillInstallation } from "./install.js";
import type { Skill, Registry } from "./types.js";
import { runBulkImport } from "./bulk-import.js";
import { runMarketplaceImport } from "./marketplace-import.js";
import { auditRegistry, auditSummary } from "./audit.js";

const VERSION = "0.1.1";
const program = new Command();
program
  .name("orchill")
  .description("Discover, inspect, install, update, and remove AI-agent skills.")
  .version(VERSION);

const registryOption = (cmd: Command) => cmd.option("-r, --registry <path>", "Path to a skills.json registry");

async function getRegistry(registryPath?: string) {
  const file = path.resolve(registryPath ?? defaultRegistryPath);
  return { ...(await loadRegistry(file)), file };
}

function categorySlug(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function resolveCategory(registry: Registry, value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  return [...new Set(registry.skills.map(s => s.category))]
    .find(category => category.toLowerCase() === normalized);
}

function resolveSkill(registry: Registry, value: string): Skill | undefined {
  return registry.skills.find(skill => skill.id === value || skill.name.toLowerCase() === value.trim().toLowerCase());
}

function resolveName(registry: Registry, value: string): {skill?: Skill; category?: string} {
  const skill = resolveSkill(registry, value);
  if (skill) return {skill};
  const category = resolveCategory(registry, value);
  if (category) return {category};
  return {};
}

function printSkill(s: Skill) {
  console.log(`\n${s.name}  [${s.id}]\n  ${s.description}\n  Category: ${s.category}`);
  if (s.tags?.length) console.log(`  Tags: ${s.tags.join(", ")}`);
  if (s.license) console.log(`  License: ${s.license}`);
  if (s.provenance) console.log(`  Provenance: ${s.provenance}`);
  console.log(`  Install path: <target>/${categorySlug(s.category)}/${s.id}/`);
}

function printCategory(registry: Registry, category: string) {
  const skills = registry.skills.filter(s => s.category === category);
  console.log(`\n${category}  [${categorySlug(category)}]`);
  console.log(`  Skills: ${skills.length}`);
  for (const skill of skills) console.log(`  ${skill.id.padEnd(28)} ${skill.name}`);
}

async function installOne(skill: Skill, root: string, target: string, cwd: string, force: boolean) {
  const result = await installSkill(skill, root, target, cwd, force);
  console.log(`✓ ${skill.id} → ${result}`);
  return result;
}

async function confirm(message: string, yes: boolean): Promise<boolean> {
  if (yes) return true;
  if (!process.stdin.isTTY) throw new Error(`Non-interactive operation requires --yes after reviewing the plan.`);
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  const answer = await rl.question(`${message} [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

async function addSkills(skills: Skill[], root: string, target: string, cwd: string, force: boolean, yes: boolean, label: string) {
  if (!skills.length) throw new Error(`Nothing eligible to install for ${label}.`);
  const destination = targetRoot(target, cwd);
  console.log(`\n${label}: ${skills.length} skill(s)`);
  console.log(`Target: ${destination}`);
  for (const skill of skills) console.log(`  ${skill.category}/${skill.id}`);
  if (!(await confirm("Continue?", yes))) { console.log("Cancelled."); return; }
  let failures = 0;
  for (const skill of skills) {
    try {
      await installOne(skill, root, target, cwd, force);
    } catch (error) {
      failures++;
      console.error(`✗ ${skill.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (failures) process.exitCode = 1;
}

const list = registryOption(program.command("list [category]").alias("ls").description("List categories, or skills in one category"))
  .option("--all", "List every skill across all categories");
list.action(async (category: string | undefined, opts: {registry?: string; all?: boolean}) => {
  const {registry} = await getRegistry(opts.registry);
  if (opts.all) {
    for (const skill of registry.skills) console.log(`${skill.category}/${skill.id.padEnd(28)} ${skill.name}`);
    return;
  }
  if (category) {
    const resolved = resolveCategory(registry, category);
    if (!resolved) throw new Error(`Unknown category: ${category}. Run "orchill list".`);
    printCategory(registry, resolved);
    return;
  }
  const groups = new Map<string, number>();
  for (const skill of registry.skills) groups.set(skill.category, (groups.get(skill.category) ?? 0) + 1);
  console.log(`Categories: ${groups.size} | Skills: ${registry.skills.length}`);
  for (const [name, count] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`${categorySlug(name).padEnd(28)} ${name} (${count})`);
  }
});

registryOption(program.command("info <name>").description("Show details for a skill or category"))
  .action(async (name: string, opts: {registry?: string}) => {
    const {registry} = await getRegistry(opts.registry);
    const resolved = resolveName(registry, name);
    if (resolved.skill) {
      printSkill(resolved.skill);
      return;
    }
    if (resolved.category) {
      printCategory(registry, resolved.category);
      return;
    }
    throw new Error(`Unknown skill or category: ${name}. Run "orchill list".`);
  });

registryOption(program.command("add <name>").description("Install a skill, category, or the full catalogue"))
  .option("-t, --target <target>", "project, agents, claude, or codex", "project")
  .option("-C, --cwd <path>", "Project directory", process.cwd())
  .option("--force", "Replace existing Orchill-managed installations")
  .option("--yes", "Skip confirmation after displaying the plan")
  .option("--dry-run", "Show the installation plan without changing files")
  .action(async (name: string, opts: {registry?: string; target: string; cwd: string; force?: boolean; yes?: boolean; dryRun?: boolean}) => {
    const {registry, root} = await getRegistry(opts.registry);
    const cwd = path.resolve(opts.cwd);
    const resolved = resolveName(registry, name);
    let skills: Skill[];
    let label: string;
    if (name.trim().toLowerCase() === "catalogue" || name.trim().toLowerCase() === "catalog") {
      skills = registry.skills;
      label = "Full catalogue";
    } else if (resolved.skill) {
      skills = [resolved.skill];
      label = `Skill ${resolved.skill.id}`;
    } else if (resolved.category) {
      skills = registry.skills.filter(s => s.category === resolved.category);
      label = `Category ${resolved.category}`;
    } else {
      throw new Error(`Unknown skill or category: ${name}. Run "orchill list".`);
    }
    const destination = targetRoot(opts.target, cwd);
    console.log(`Target: ${destination}`);
    for (const skill of skills) console.log(`  ${skill.category}/${skill.id}`);
    if (opts.dryRun) { console.log("Dry run only; no files changed."); return; }
    await addSkills(skills, root, opts.target, cwd, Boolean(opts.force), Boolean(opts.yes), label);
    console.log("Review third-party skill instructions before using them. Orchill does not execute installed scripts.");
  });

registryOption(program.command("update").alias("up").description("Update Orchill-managed installed skills"))
  .option("-t, --target <target>", "project, agents, claude, or codex", "project")
  .option("-C, --cwd <path>", "Project directory", process.cwd())
  .option("--yes", "Skip confirmation")
  .option("--dry-run", "Show the update plan without changing files")
  .action(async (opts: {registry?: string; target: string; cwd: string; yes?: boolean; dryRun?: boolean}) => {
    const {registry, root} = await getRegistry(opts.registry);
    const cwd = path.resolve(opts.cwd);
    const target = targetRoot(opts.target, cwd);
    let entries: {skill: Skill; path: string}[] = [];
    try {
      for (const category of await readdir(target, {withFileTypes: true})) {
        if (!category.isDirectory() || category.isSymbolicLink()) continue;
        for (const entry of await readdir(path.join(target, category.name), {withFileTypes: true})) {
          if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
          const skill = registry.skills.find(s => categorySlug(s.category) === category.name && s.id === entry.name);
          if (skill) entries.push({skill, path: path.join(category.name, entry.name)});
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (!entries.length) { console.log("No registered installed skills found to update."); return; }
    console.log(`Updates: ${entries.length}`);
    for (const entry of entries) console.log(`  ${entry.path}`);
    if (opts.dryRun) { console.log("Dry run only; no files changed."); return; }
    if (!(await confirm("Update these skills?", Boolean(opts.yes)))) { console.log("Cancelled."); return; }
    let failures = 0;
    for (const entry of entries) {
      try { await installOne(entry.skill, root, opts.target, cwd, true); }
      catch (error) { failures++; console.error(`✗ ${entry.skill.id}: ${error instanceof Error ? error.message : String(error)}`); }
    }
    if (failures) process.exitCode = 1;
  });

registryOption(program.command("remove <name>").alias("rm").description("Remove an Orchill-managed skill or category"))
  .option("-t, --target <target>", "project, agents, claude, or codex", "project")
  .option("-C, --cwd <path>", "Project directory", process.cwd())
  .option("--yes", "Skip confirmation")
  .option("--dry-run", "Show the removal plan without changing files")
  .action(async (name: string, opts: {registry?: string; target: string; cwd: string; yes?: boolean; dryRun?: boolean}) => {
    const {registry} = await getRegistry(opts.registry);
    const cwd = path.resolve(opts.cwd);
    const resolved = resolveName(registry, name);
    let skills: Skill[];
    if (name.trim().toLowerCase() === "catalogue" || name.trim().toLowerCase() === "catalog") skills = registry.skills;
    else if (resolved.skill) skills = [resolved.skill];
    else if (resolved.category) skills = registry.skills.filter(s => s.category === resolved.category);
    else throw new Error(`Unknown skill or category: ${name}. Run "orchill list".`);
    console.log(`Removals: ${skills.length}`);
    for (const skill of skills) console.log(`  ${skill.category}/${skill.id}`);
    if (opts.dryRun) { console.log("Dry run only; no files changed."); return; }
    if (!(await confirm("Remove these Orchill-managed installations?", Boolean(opts.yes)))) { console.log("Cancelled."); return; }
    let failures = 0;
    for (const skill of skills) {
      try {
        const result = await verifySkillInstallation(skill.id, opts.target, cwd, skill.category);
        if (!result.installed) { console.log(`- ${skill.id}: not installed`); continue; }
        if (!result.managed) throw new Error("installation is unmanaged");
        await uninstallSkill(skill.id, opts.target, cwd, skill.category);
        console.log(`✓ ${skill.id} removed`);
      } catch (error) {
        failures++;
        console.error(`✗ ${skill.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (failures) process.exitCode = 1;
  });

registryOption(program.command("check [name]").description("Verify Orchill-managed installations and registry integrity"))
  .option("-t, --target <target>", "project, agents, claude, or codex", "project")
  .option("-C, --cwd <path>", "Project directory", process.cwd())
  .option("--json", "Output machine-readable JSON")
  .action(async (name: string | undefined, opts: {registry?: string; target: string; cwd: string; json?: boolean}) => {
    const {registry} = await getRegistry(opts.registry);
    const cwd = path.resolve(opts.cwd);
    const resolved = name ? resolveName(registry, name) : {};
    let selected = registry.skills;
    if (resolved.skill) selected = [resolved.skill];
    else if (resolved.category) selected = registry.skills.filter(s => s.category === resolved.category);
    else if (name) throw new Error(`Unknown skill or category: ${name}. Run "orchill list".`);
    const results = [];
    for (const skill of selected) {
      const result = await verifySkillInstallation(skill.id, opts.target, cwd, skill.category);
      if (result.installed) results.push(result);
    }
    const problems = results.filter(result => result.problems.length);
    const summary = {installed: results.length, healthy: results.length - problems.length, problems: problems.length};
    if (opts.json) console.log(JSON.stringify({summary, results}, null, 2));
    else {
      console.log(`Installed: ${summary.installed} | Healthy: ${summary.healthy} | Problems: ${summary.problems}`);
      for (const result of results) {
        console.log(`${result.problems.length ? "✗" : "✓"} ${result.skillId} → ${result.destination}`);
        for (const problem of result.problems) console.log(`  - ${problem}`);
      }
    }
    if (problems.length) process.exitCode = 1;
  });

registryOption(program.command("audit").description("Audit catalog metadata and local skills for review-worthy patterns"))
  .option("--json", "Output machine-readable JSON")
  .option("--strict", "Exit non-zero when any audit finding exists")
  .action(async (opts: {registry?: string; json?: boolean; strict?: boolean}) => {
    const {registry, root} = await getRegistry(opts.registry);
    const findings = await auditRegistry(registry, root);
    const summary = auditSummary(findings, registry.skills.length);
    if (opts.json) console.log(JSON.stringify({summary, findings}, null, 2));
    else {
      console.log(`Catalog audit: ${summary.totalSkills} skills; ${summary.totalFindings} findings (${summary.errors} errors, ${summary.warnings} warnings, ${summary.reviewItems} review items).`);
      for (const finding of findings) {
        const location = finding.file ? ` — ${path.relative(process.cwd(), finding.file)}${finding.line ? `:${finding.line}` : ""}` : "";
        console.log(`[${finding.severity.toUpperCase()}] ${finding.skillId} ${finding.code}: ${finding.message}${location}`);
      }
      if (!findings.length) console.log("No audit findings. This is not a guarantee that skills are safe or correctly licensed.");
      console.log("Heuristic matches require human review; remote Git content is not downloaded or scanned.");
    }
    if (summary.errors > 0 || (opts.strict && findings.length > 0)) process.exitCode = 1;
  });

registryOption(program.command("registry").description("Show active registry location")).action(async (opts: {registry?: string}) => {
  const {registry, file} = await getRegistry(opts.registry);
  console.log(`Registry: ${file}\nVersion: ${registry.version}\nSkills: ${registry.skills.length}`);
});

program.command("mcp").description("Run the Orchill MCP server over stdio").action(async () => { const { runMcpServer } = await import("./mcp.js"); await runMcpServer(); });

program.command("targets").description("Show supported installation targets").action(() => {
  console.log("project  .agents/skills/<category>/<skill>\nagents   .agents/skills/<category>/<skill>\nclaude   .claude/skills/<category>/<skill>\ncodex    .agents/skills/<category>/<skill>");
});

program.command("init").description("Create an empty project-local registry template").option("-C, --cwd <path>", "Project directory", process.cwd()).action(async (opts: {cwd: string}) => {
  const dir = path.join(path.resolve(opts.cwd), ".orchill");
  const file = path.join(dir, "skills.json");
  try { await access(file); throw new Error(`Already exists: ${file}`); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await mkdir(dir, {recursive: true});
  await writeFile(file, JSON.stringify({version: 1, skills: []}, null, 2) + "\n", {flag: "wx"});
  console.log(`Created ${file}. Add trusted skill metadata, then use --registry ${file}.`);
});

program.command("import <file>").description("Import Skills CLI or agent marketplace commands").option("-o, --output <directory>", "Output directory", ".orchill-import").option("-c, --category <category>", "Imported skill category", "Imported — review required").option("--dry-run", "Parse and preview without downloading").action(async (file: string, opts: {output: string; category: string; dryRun?: boolean}) => {
  const input = await readFile(path.resolve(file), "utf8");
  const activeLines = input.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#"));
  const marketplaceLines = activeLines.filter(line => line.startsWith("/plugin "));
  if (marketplaceLines.length && marketplaceLines.length !== activeLines.length) throw new Error("Do not mix npx skills add and /plugin commands in one file yet. Use one command family per file.");
  if (marketplaceLines.length) await runMarketplaceImport(file, opts.output, opts.category, Boolean(opts.dryRun));
  else await runBulkImport(file, opts.output, opts.category, Boolean(opts.dryRun));
});

program.command("import-commands <file>").description("Compatibility alias for import").action(async (file: string, opts: {output?: string; category?: string; dryRun?: boolean}) => {
  const output = opts.output ?? ".orchill-import";
  const category = opts.category ?? "Imported — review required";
  const input = await readFile(path.resolve(file), "utf8");
  const activeLines = input.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#"));
  const marketplaceLines = activeLines.filter(line => line.startsWith("/plugin "));
  if (marketplaceLines.length && marketplaceLines.length !== activeLines.length) throw new Error("Do not mix command families in one file.");
  if (marketplaceLines.length) await runMarketplaceImport(file, output, category, Boolean(opts.dryRun));
  else await runBulkImport(file, output, category, Boolean(opts.dryRun));
}).option("-o, --output <directory>", "Output directory").option("-c, --category <category>", "Imported skill category").option("--dry-run", "Parse and preview without downloading");

program.addHelpText("before", `
Orchill uses the same commands for humans and AI agents.

Quick start:
  orchill list                 List categories
  orchill list <category>      List skills in a category
  orchill list --all           List every skill
  orchill info <name>          Inspect a skill or category
  orchill add <name>           Install a skill or category
  orchill add catalogue        Install the entire eligible catalogue
  orchill update               Update installed skills
  orchill remove <name>       Remove a skill or category
  orchill check                Verify installed skills
`);

program.addHelpText("after", `
Installation structure:
  <target>/<category>/<skill>/
  The complete skill directory is preserved, including SKILL.md, references,
  scripts, examples, and assets.

Targets:
  project, agents  .agents/skills/
  claude            .claude/skills/
  codex             .agents/skills/

Safety:
  Installation never executes skill scripts.
  Existing content is not replaced unless --force is supplied.
  Removal only touches Orchill-managed installations.
  Review provenance, licensing, and third-party instructions before use.
  Excluded catalogue entries are never installed.

Agent integration:
  Humans and agents use the same CLI commands.
  skills/orchill-cli/SKILL.md is shipped as an agent-readable integration skill.
  AGENTS.md documents agent discovery and safety.
  MCP integrations, when configured by a host, expose the same Orchill operations.

Automation:
  Use --json where offered for machine-readable output.
  Use --yes only after reviewing the displayed plan.

Examples:
  orchill list
  orchill list "UI/UX Design"
  orchill info demo-focus
  orchill add demo-focus
  orchill add "UI/UX Design"
  orchill add catalogue
  orchill add demo-focus --dry-run
  orchill update --dry-run
  orchill update --yes
  orchill remove demo-focus --yes
  orchill check --json
`);

program.showHelpAfterError();
program.parseAsync(process.argv).catch(error => {
  console.error(`orchill: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
