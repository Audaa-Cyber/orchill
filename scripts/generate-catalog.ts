import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Skill = {
  id: string;
  name: string;
  description?: string;
  category: string;
  source?: { type?: string; path?: string; url?: string; ref?: string };
  license?: string;
};
type Registry = { skills: Skill[] };

const root = process.cwd();
const registryPath = path.join(root, "registry", "skills.json");
const outputRoot = path.join(root, "catalog");
const repository = "Audaa-Cyber/orchill";
const branch = "main";

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function cell(value: unknown): string {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
function sourceLink(skill: Skill): string {
  if (skill.source?.type === "local" && skill.source.path) {
    const payload = skill.source.path.replace(/^\.\.\//, "");
    return "[`" + cell(payload) + "`](https://github.com/" + repository + "/tree/" + branch + "/" + payload + ")";
  }
  if (skill.source?.url) return "[upstream](" + skill.source.url + ")";
  return "Not specified";
}

const registry = JSON.parse(await readFile(registryPath, "utf8")) as Registry;
if (!Array.isArray(registry.skills)) throw new Error("registry/skills.json must contain a skills array");
const ids = new Set<string>();
for (const skill of registry.skills) {
  if (!skill.id || ids.has(skill.id)) throw new Error("Missing or duplicate skill id: " + skill.id);
  ids.add(skill.id);
  if (!skill.category) throw new Error("Missing category for skill: " + skill.id);
}
const categories = [...new Set(registry.skills.map(skill => skill.category))].sort((a, b) => a.localeCompare(b));
const byCategory = new Map(categories.map(category => [category,
  registry.skills.filter(skill => skill.category === category).sort((a, b) => a.name.localeCompare(b.name))]));
const manifest = {
  version: 1,
  generatedFrom: "registry/skills.json",
  categoryCount: categories.length,
  skillCount: registry.skills.length,
  categories: categories.map(name => ({
    name, slug: slugify(name), count: byCategory.get(name)!.length,
    index: "catalog/categories/" + slugify(name) + "/README.md"
  }))
};
await mkdir(path.join(outputRoot, "categories"), { recursive: true });
await writeFile(path.join(outputRoot, "categories.json"), JSON.stringify(manifest, null, 2) + "\n");

const tree = categories.map(category =>
  "    └── " + slugify(category) + "/README.md  # " + category + " (" + byCategory.get(category)!.length + ")"
).join("\n");
await writeFile(path.join(outputRoot, "README.md"), `# Orchill Skill Catalog

This directory is the human-browsable catalogue generated from the canonical registry at [\`registry/skills.json\`](../registry/skills.json).

- **${registry.skills.length} skills** across **${categories.length} categories**
- [Browse all skills](CATALOG.md)
- [Category manifest](categories.json)
- [Browse category folders](categories/)

## Structure

${tree}

Each category folder contains a sorted index of skills and links to the canonical payload under \`skills/<category-slug>/<skill-id>/\`. The registry is the source of truth; this catalogue is generated for browsing.

Regenerate after editing the registry with \`npm run catalog:generate\`.
`);
const allSkills = [...registry.skills].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
const allRows = allSkills.map(skill => {
  const link = skill.source?.type === "local" && skill.source.path
    ? "https://github.com/" + repository + "/tree/" + branch + "/" + skill.source.path.replace(/^\.\.\//, "")
    : skill.source?.url || "https://github.com/" + repository;
  return "| " + cell(skill.category) + " | [" + cell(skill.name) + "](" + link + ") | \`" + cell(skill.id) + "\` | " + cell(skill.source?.type) + " | " + sourceLink(skill) + " |";
}).join("\n");
await writeFile(path.join(outputRoot, "CATALOG.md"), `# Orchill Skill Catalog

> Generated from \`registry/skills.json\`. Do not edit manually; update the registry and run \`npm run catalog:generate\`.

**${registry.skills.length} skills · ${categories.length} categories**

## Categories

${categories.map(category => "- [" + category + "](categories/" + slugify(category) + "/README.md) — " + byCategory.get(category)!.length + " skills").join("\n")}

## Complete index

| Category | Skill | ID | Source type | Payload/source |
|---|---|---|---|---|
${allRows}
`);
for (const category of categories) {
  const folder = path.join(outputRoot, "categories", slugify(category));
  await mkdir(folder, { recursive: true });
  const rows = byCategory.get(category)!.map(skill =>
    `| ${cell(skill.name)} | \`${cell(skill.id)}\` | ${cell(skill.source?.type)} | ${sourceLink(skill)} | ${cell(skill.license || "Unknown")} |`
  ).join("\n");
  await writeFile(path.join(folder, "README.md"), `# ${category}

**${byCategory.get(category)!.length} skills** · [All categories](../../CATALOG.md)

Generated from \`registry/skills.json\`. Local payloads live under \`skills/<category-slug>/<skill-id>/\`; Git-backed skills remain remote.

| Skill | ID | Source | Payload/source | License metadata |
|---|---|---|---|---|
${rows}
`);
}
console.log(`Generated catalog for ${registry.skills.length} skills across ${categories.length} categories.`);
