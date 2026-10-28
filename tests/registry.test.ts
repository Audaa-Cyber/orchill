import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { defaultRegistryPath, loadRegistry } from "../src/registry.js";

test("default registry is valid and IDs are unique", async () => {
  const {registry} = await loadRegistry(defaultRegistryPath);
  assert.equal(registry.version, 1);
  assert.ok(registry.skills.length >= 4);
  assert.equal(new Set(registry.skills.map(s => s.id)).size, registry.skills.length);
  assert.ok(registry.skills.some(s => s.id === "frontend-design"));
});


function categorySlug(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

test("every local registry entry maps to its category folder and bundled SKILL.md", async () => {
  const {registry, root} = await loadRegistry(defaultRegistryPath);
  const localSkills = registry.skills.filter(skill => skill.source.type === "local");
  assert.ok(localSkills.length > 0);
  for (const skill of localSkills) {
    assert.match(skill.source.path!, /^\.\.\/skills\/[a-z0-9-]+\/[a-z0-9-]+$/);
    const segments = skill.source.path!.split("/");
    assert.equal(segments[0], "..");
    assert.equal(segments[1], "skills");
    assert.equal(segments[2], categorySlug(skill.category),
      `${skill.id} must live in the folder derived from category "${skill.category}"`);
    assert.equal(segments[3], skill.id,
      `${skill.id} must be the final directory name in its registry path`);
    const sourceRoot = path.resolve(root, skill.source.path!);
    const skillRoot = skill.skillPath === "." ? sourceRoot : path.resolve(sourceRoot, skill.skillPath);
    try {
      await access(path.join(skillRoot, "SKILL.md"));
    } catch {
      assert.fail(`${skill.id} must have a bundled SKILL.md at ${skillRoot}`);
    }
  }
});


test("generated catalogue indexes cover every registry skill and category", async () => {
  const {registry, root} = await loadRegistry(defaultRegistryPath);
  const projectRoot = path.resolve(root, "..");
  const catalog = await readFile(path.join(projectRoot, "catalog", "CATALOG.md"), "utf8");
  for (const skill of registry.skills) {
    assert.ok(catalog.includes("`" + skill.id + "`"),
      `catalog/CATALOG.md must include registry skill ${skill.id}`);
  }

  const categories = [...new Set(registry.skills.map(skill => skill.category))];
  for (const category of categories) {
    const indexPath = path.join(projectRoot, "catalog", "categories", categorySlug(category), "README.md");
    let index: string;
    try {
      index = await readFile(indexPath, "utf8");
    } catch {
      assert.fail(`Missing category index for "${category}" at ${indexPath}`);
    }
    for (const skill of registry.skills.filter(item => item.category === category)) {
      assert.ok(index.includes("`" + skill.id + "`"),
        `category index "${category}" must include ${skill.id}`);
    }
  }
});

test("rejects duplicate skill IDs", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "orchill-registry-test-"));
  try {
    const file = path.join(temp, "skills.json");
    const skill = {
      id: "same-id",
      name: "Example",
      description: "Test",
      category: "Test",
      source: {type: "local", path: "."},
      skillPath: "."
    };
    await writeFile(file, JSON.stringify({version: 1, skills: [skill, skill]}));
    await assert.rejects(() => loadRegistry(file), /Duplicate skill id/);
  } finally {
    await rm(temp, {recursive: true, force: true});
  }
});

test("rejects invalid IDs and non-HTTPS Git sources", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "orchill-registry-test-"));
  try {
    const file = path.join(temp, "skills.json");
    const base = {
      id: "Bad ID",
      name: "Example",
      description: "Test",
      category: "Test",
      source: {type: "local", path: "."},
      skillPath: "."
    };
    await writeFile(file, JSON.stringify({version: 1, skills: [base]}));
    await assert.rejects(() => loadRegistry(file), /Invalid skill id/);
    await writeFile(file, JSON.stringify({version: 1, skills: [{
      ...base, id: "bad-source", source: {type: "git", url: "http://example.com/repo.git"}
    }]}));
    await assert.rejects(() => loadRegistry(file), /HTTPS/);
    await writeFile(file, JSON.stringify({version: 1, skills: [{
      ...base, id: "credential-source", source: {type: "git", url: "https://user:secret@example.com/repo.git"}
    }]}));
    await assert.rejects(() => loadRegistry(file), /credentials/);
  } finally {
    await rm(temp, {recursive: true, force: true});
  }
});
