import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { defaultRegistryPath, loadRegistry } from "../src/registry.js";

function categorySlug(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const validSkill = () => ({
  id: "example-skill",
  name: "Example",
  description: "Test skill",
  category: "Testing",
  source: { type: "local", path: "." },
  skillPath: ".",
  tags: ["test"],
  targets: ["project"]
});

async function withRegistry(skills: unknown[], callback: (file: string) => Promise<void>) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "orchill-registry-test-"));
  try {
    const file = path.join(temp, "skills.json");
    await writeFile(file, JSON.stringify({ version: 1, skills }));
    await callback(file);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

test("default registry is valid and IDs are unique", async () => {
  const { registry } = await loadRegistry(defaultRegistryPath);
  assert.equal(registry.version, 1);
  assert.ok(registry.skills.length >= 4);
  assert.equal(new Set(registry.skills.map(s => s.id)).size, registry.skills.length);
  assert.ok(registry.skills.some(s => s.id === "frontend-design"));
});

test("rejects duplicate skill IDs", async () => {
  const skill = validSkill();
  await withRegistry([skill, skill], async file => {
    await assert.rejects(() => loadRegistry(file), /Duplicate skill id/);
  });
});

test("rejects invalid IDs and non-HTTPS Git sources", async () => {
  const base = validSkill();
  await withRegistry([{ ...base, id: "Bad ID" }], async file => {
    await assert.rejects(() => loadRegistry(file), /Invalid skill id/);
  });
  await withRegistry([{ ...base, id: "bad-source", source: { type: "git", url: "http://example.com/repo.git" } }], async file => {
    await assert.rejects(() => loadRegistry(file), /clean HTTPS URL/);
  });
  await withRegistry([{ ...base, id: "credential-source", source: { type: "git", url: "https://user:secret@example.com/repo.git" } }], async file => {
    await assert.rejects(() => loadRegistry(file), /clean HTTPS URL/);
  });
  await withRegistry([{ ...base, id: "query-source", source: { type: "git", url: "https://example.com/repo.git?token=abc" } }], async file => {
    await assert.rejects(() => loadRegistry(file), /clean HTTPS URL/);
  });
});

test("rejects unknown metadata keys at every level", async () => {
  await withRegistry([{ ...validSkill(), unreviewed: true }], async file => {
    await assert.rejects(() => loadRegistry(file), /unsupported field/);
  });
  await withRegistry([{ ...validSkill(), source: { type: "local", path: ".", command: "run me" } }], async file => {
    await assert.rejects(() => loadRegistry(file), /unsupported field/);
  });
  await withRegistry([{ ...validSkill() }], async file => {
    const parsed = JSON.parse(await (await import("node:fs/promises")).readFile(file, "utf8"));
    parsed.unexpected = true;
    await writeFile(file, JSON.stringify(parsed));
    await assert.rejects(() => loadRegistry(file), /Registry contains unsupported field/);
  });
});

test("rejects invalid optional fields and unsupported targets", async () => {
  await withRegistry([{ ...validSkill(), license: "  " }], async file => {
    await assert.rejects(() => loadRegistry(file), /license must be a non-empty string/);
  });
  await withRegistry([{ ...validSkill(), tags: ["test", "test"] }], async file => {
    await assert.rejects(() => loadRegistry(file), /tags must not contain duplicates/);
  });
  await withRegistry([{ ...validSkill(), targets: ["project", "unknown-agent"] }], async file => {
    await assert.rejects(() => loadRegistry(file), /targets must contain only/);
  });
});

test("rejects skill paths that are absolute or escape their source", async () => {
  await withRegistry([{ ...validSkill(), skillPath: "../outside" }], async file => {
    await assert.rejects(() => loadRegistry(file), /invalid skillPath/);
  });
  await withRegistry([{ ...validSkill(), skillPath: "/tmp/outside" }], async file => {
    await assert.rejects(() => loadRegistry(file), /invalid skillPath/);
  });
  await withRegistry([{ ...validSkill(), skillPath: "safe/../outside" }], async file => {
    await assert.rejects(() => loadRegistry(file), /parent-directory segments/);
  });
  await withRegistry([{ ...validSkill(), skillPath: "safe\\\\outside" }], async file => {
    await assert.rejects(() => loadRegistry(file), /forward slashes/);
  });
  await withRegistry([{ ...validSkill(), source: { type: "local", path: "..\\\\outside" } }], async file => {
    await assert.rejects(() => loadRegistry(file), /relative path/);
  });
});


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

