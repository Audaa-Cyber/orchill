#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { loadRegistry, defaultRegistryPath } from "./registry.js";
import { installSkill, targetRoot, uninstallSkill, verifySkillInstallation } from "./install.js";
import type { Skill } from "./types.js";
import { runBulkImport } from "./bulk-import.js";
import { runMarketplaceImport } from "./marketplace-import.js";
import { auditRegistry, auditSummary } from "./audit.js";

const program = new Command();
program.name("orchill").description("Find and selectively install AI agent skills.").version("0.1.0");
const registryOption = (cmd: Command) => cmd.option("-r, --registry <path>", "Path to a skills.json registry");

async function getRegistry(registryPath?: string) {
  const file = path.resolve(registryPath ?? defaultRegistryPath);
  return { ...(await loadRegistry(file)), file };
}
function printSkill(s: Skill) {
  console.log(`\n${s.name}  [${s.id}]\n  ${s.description}\n  Category: ${s.category}`);
  if (s.tags?.length) console.log(`  Tags: ${s.tags.join(", ")}`);
  if (s.license) console.log(`  License: ${s.license}`);
  if (s.provenance) console.log(`  Source notes: ${s.provenance}`);
}

program.command("search <query>").description("Search skill names, descriptions, categories, and tags").option("-r, --registry <path>", "Registry file").action(async (query: string, opts: {registry?: string}) => {
  const {registry} = await getRegistry(opts.registry);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const found = registry.skills.map(skill => {
    const haystack = [skill.id, skill.name, skill.description, skill.category, ...(skill.tags ?? [])].join(" ").toLowerCase();
    const score = terms.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0);
    return {skill, score};
  }).filter(x => x.score > 0).sort((a,b) => b.score-a.score || a.skill.name.localeCompare(b.skill.name));
  if (!found.length) { console.log("No matching skills. Add trusted entries to your registry or broaden the query."); return; }
  for (const {skill, score} of found) console.log(`${skill.id.padEnd(24)} ${skill.name} — ${skill.description} [match ${score}/${terms.length}]`);
});
const list = registryOption(program.command("list").description("List skills, optionally filtered by category"))
  .option("-c, --category <category>", "Filter by category");
list.action(async (opts: {registry?: string; category?: string}) => {
  const {registry} = await getRegistry(opts.registry);
  const skills = registry.skills.filter(s => !opts.category || s.category.toLowerCase() === opts.category.toLowerCase());
  if (!skills.length) { console.log("No skills found for that filter."); return; }
  for (const s of skills) console.log(`${s.id.padEnd(24)} ${s.name} — ${s.category}`);
});
registryOption(program.command("categories").description("List skill categories")).action(async (opts: {registry?: string}) => {
  const {registry} = await getRegistry(opts.registry);
  const groups = new Map<string, number>();
  for (const s of registry.skills) groups.set(s.category, (groups.get(s.category) ?? 0) + 1);
  if (!groups.size) { console.log("Registry has no skills yet."); return; }
  for (const [category, count] of [...groups].sort(([a],[b]) => a.localeCompare(b))) console.log(`${category} (${count})`);
});
registryOption(program.command("audit").description("Audit catalog metadata and scan local skills for review-worthy patterns"))
  .option("--json", "Output machine-readable JSON")
  .option("--strict", "Exit non-zero when any audit finding exists")
  .action(async (opts: {registry?: string; json?: boolean; strict?: boolean}) => {
    const {registry, root} = await getRegistry(opts.registry);
    const findings = await auditRegistry(registry, root);
    const summary = auditSummary(findings, registry.skills.length);
    if (opts.json) {
      console.log(JSON.stringify({ summary, findings }, null, 2));
    } else {
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
registryOption(program.command("info <id>").description("Show a skill's metadata")).action(async (id: string, opts: {registry?: string}) => {
  const {registry} = await getRegistry(opts.registry);
  const skill = registry.skills.find(s => s.id === id);
  if (!skill) throw new Error(`Unknown skill: ${id}. Run "orchill search <query>".`);
  printSkill(skill);
  console.log(`  Install targets: ${(skill.targets ?? ["project"]).join(", ")}`);
});
registryOption(program.command("install <id>").description("Install one skill and preserve its nested files"))
  .option("-t, --target <target>", "project, agents, claude, or codex", "project")
  .option("-C, --cwd <path>", "Project directory", process.cwd())
  .option("--force", "Replace an existing installation")
  .option("--dry-run", "Preview destination without copying")
  .action(async (id: string, opts: {registry?: string; target: string; cwd: string; force?: boolean; dryRun?: boolean}) => {
    const {registry, root} = await getRegistry(opts.registry);
    const skill = registry.skills.find(s => s.id === id);
    if (!skill) throw new Error(`Unknown skill: ${id}. Run "orchill search <query>".`);
    const destination = path.join(targetRoot(opts.target, path.resolve(opts.cwd)), skill.id);
    console.log(`Skill: ${skill.name} (${skill.id})\nTarget: ${opts.target}\nDestination: ${destination}\nSource type: ${skill.source.type}\nLicense: ${skill.license ?? "not specified"}`);
    if (opts.dryRun) { console.log("Dry run only; no files changed."); return; }
    const result = await installSkill(skill, root, opts.target, path.resolve(opts.cwd), Boolean(opts.force));
    console.log(`Installed successfully: ${result}`);
    console.log("Review third-party skill instructions before using them. Orchill does not execute installed scripts.");
  });
registryOption(program.command("install-category <category>").description("Preview and install all skills in one category"))
  .option("-t, --target <target>", "project, agents, claude, or codex", "project")
  .option("-C, --cwd <path>", "Project directory", process.cwd())
  .option("--force", "Replace existing installations")
  .option("--yes", "Skip confirmation after displaying the plan")
  .action(async (category: string, opts: {registry?: string; target: string; cwd: string; force?: boolean; yes?: boolean}) => {
    const {registry, root} = await getRegistry(opts.registry);
    const skills = registry.skills.filter(s => s.category.toLowerCase() === category.toLowerCase());
    if (!skills.length) throw new Error(`No skills in category "${category}". Run "orchill categories".`);
    console.log(`Planned installs (${skills.length}) into ${targetRoot(opts.target, path.resolve(opts.cwd))}:`);
    for (const s of skills) console.log(`  • ${s.id} — ${s.name}`);
    if (!opts.yes) {
      if (!process.stdin.isTTY) throw new Error("Non-interactive category install requires --yes after reviewing the plan.");
      const readline = await import("node:readline/promises");
      const rl = readline.createInterface({input: process.stdin, output: process.stdout});
      const answer = await rl.question("Continue? [y/N] ");
      rl.close();
      if (!/^y(es)?$/i.test(answer.trim())) { console.log("Cancelled."); return; }
    }
    let failures = 0;
    for (const s of skills) {
      try {
        const dest = await installSkill(s, root, opts.target, path.resolve(opts.cwd), Boolean(opts.force));
        console.log(`✓ ${s.id} → ${dest}`);
      } catch (error) {
        failures++;
        console.error(`✗ ${s.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (failures) process.exitCode = 1;
  });
registryOption(program.command("verify <id>").description("Verify an installed skill and its Orchill marker"))
  .option("-t, --target <target>", "project, agents, claude, or codex", "project")
  .option("-C, --cwd <path>", "Project directory", process.cwd())
  .action(async (id: string, opts: {registry?: string; target: string; cwd: string}) => {
    const result = await verifySkillInstallation(id, opts.target, path.resolve(opts.cwd));
    console.log(`Skill: ${result.skillId}\nDestination: ${result.destination}\nManaged by Orchill: ${result.managed ? "yes" : "no"}\nSKILL.md present: ${result.hasSkillFile ? "yes" : "no"}`);
    if (result.problems.length) {
      for (const problem of result.problems) console.error(`- ${problem}`);
      process.exitCode = 1;
    } else console.log("Verification passed.");
  });
registryOption(program.command("uninstall <id>").description("Remove a skill installed and marked by Orchill"))
  .option("-t, --target <target>", "project, agents, claude, or codex", "project")
  .option("-C, --cwd <path>", "Project directory", process.cwd())
  .option("--yes", "Confirm removal after reviewing the destination")
  .action(async (id: string, opts: {registry?: string; target: string; cwd: string; yes?: boolean}) => {
    const checked = await verifySkillInstallation(id, opts.target, path.resolve(opts.cwd));
    console.log(`Skill: ${id}\nDestination: ${checked.destination}\nManaged by Orchill: ${checked.managed ? "yes" : "no"}`);
    if (!checked.managed) throw new Error("Refusing to uninstall a directory without a valid Orchill marker.");
    if (!opts.yes) {
      if (!process.stdin.isTTY) throw new Error("Non-interactive uninstall requires --yes after reviewing the destination.");
      const readline = await import("node:readline/promises");
      const rl = readline.createInterface({input: process.stdin, output: process.stdout});
      const answer = await rl.question("Remove this skill directory? [y/N] ");
      rl.close();
      if (!/^y(es)?$/i.test(answer.trim())) { console.log("Cancelled."); return; }
    }
    const removed = await uninstallSkill(id, opts.target, path.resolve(opts.cwd));
    console.log(`Uninstalled: ${removed}`);
  });
program.command("import-commands <file>").description("Bulk-import Skills CLI commands or agent plugin marketplace commands")
  .option("-o, --output <directory>", "Output directory", ".orchill-import")
  .option("-c, --category <category>", "Imported skill category", "Imported — review required")
  .option("--dry-run", "Parse and preview without downloading")
  .action(async (file: string, opts: {output: string; category: string; dryRun?: boolean}) => {
    const input = await readFile(path.resolve(file), "utf8");
    const activeLines = input.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#"));
    const marketplaceLines = activeLines.filter(line => line.startsWith("/plugin "));
    if (marketplaceLines.length && marketplaceLines.length !== activeLines.length) {
      throw new Error("Do not mix npx skills add and /plugin commands in one file yet. Put each command family in its own file and run import-commands separately.");
    }
    if (marketplaceLines.length) await runMarketplaceImport(file, opts.output, opts.category, Boolean(opts.dryRun));
    else await runBulkImport(file, opts.output, opts.category, Boolean(opts.dryRun));
  });
program.command("targets").description("Show supported installation targets").action(() => {
  console.log("project  .agents/skills (recommended cross-agent project location)\nagents   .agents/skills\nclaude   .claude/skills\ncodex    .agents/skills (Codex project skills)");
});
program.command("registry").description("Show active registry location").option("-r, --registry <path>", "Registry file").action(async (opts: {registry?: string}) => {
  const {registry, file} = await getRegistry(opts.registry);
  console.log(`Registry: ${file}\nVersion: ${registry.version}\nSkills: ${registry.skills.length}`);
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
program.addHelpText("after", `
Examples:
  orchill search animation
  orchill categories
  orchill audit
  orchill info demo-focus
  orchill install demo-focus --dry-run
  orchill install demo-focus --target claude
  orchill install-category "Tooling & MCP Development"
  orchill list --category "Animation & Motion"
`);
program.showHelpAfterError();
program.parseAsync(process.argv).catch(error => {
  console.error(`orchill: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
