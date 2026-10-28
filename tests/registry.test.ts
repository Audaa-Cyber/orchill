import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
