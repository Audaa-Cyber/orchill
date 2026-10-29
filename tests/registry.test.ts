import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { defaultRegistryPath, loadRegistry } from "../src/registry.js";

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
