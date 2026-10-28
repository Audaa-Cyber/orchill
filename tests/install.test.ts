import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { installSkill } from "../src/install.js";
import type { Skill } from "../src/types.js";

test("installs a complete nested skill directory", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "orchill-test-"));
  try {
    const registryRoot = path.join(temp, "registry");
    const source = path.join(temp, "source-skill");
    const cwd = path.join(temp, "project");
    await mkdir(path.join(source, "references"), {recursive: true});
    await mkdir(registryRoot, {recursive: true});
    await mkdir(cwd, {recursive: true});
    await writeFile(path.join(source, "SKILL.md"), "# Test skill\n");
    await writeFile(path.join(source, "references", "guide.md"), "Nested guide\n");
    const skill: Skill = {
      id: "test-skill",
      name: "Test skill",
      description: "Fixture",
      category: "Tests",
      source: {type: "local", path: "../source-skill"},
      skillPath: "."
    };
    const installed = await installSkill(skill, registryRoot, "project", cwd);
    assert.equal(await readFile(path.join(installed, "SKILL.md"), "utf8"), "# Test skill\n");
    assert.equal(await readFile(path.join(installed, "references", "guide.md"), "utf8"), "Nested guide\n");
    await assert.rejects(() => installSkill(skill, registryRoot, "project", cwd), /Already exists/);
    await writeFile(path.join(source, "SKILL.md"), "# Updated skill\n");
    const replaced = await installSkill(skill, registryRoot, "project", cwd, true);
    assert.equal(await readFile(path.join(replaced, "SKILL.md"), "utf8"), "# Updated skill\n");
  } finally {
    await rm(temp, {recursive: true, force: true});
  }
});

test("failed forced replacement keeps the previous install", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "orchill-rollback-test-"));
  try {
    const registryRoot = path.join(temp, "registry");
    const source = path.join(temp, "source-skill");
    const cwd = path.join(temp, "project");
    await mkdir(registryRoot, {recursive: true});
    await mkdir(source, {recursive: true});
    await mkdir(cwd, {recursive: true});
    await writeFile(path.join(source, "SKILL.md"), "known-good\n");
    const skill: Skill = {
      id: "safe-skill", name: "Safe skill", description: "Fixture", category: "Tests",
      source: {type: "local", path: "../source-skill"}, skillPath: "."
    };
    const installed = await installSkill(skill, registryRoot, "project", cwd);
    const broken: Skill = {...skill, source: {type: "local", path: "../missing-source"}};
    await assert.rejects(() => installSkill(broken, registryRoot, "project", cwd, true));
    assert.equal(await readFile(path.join(installed, "SKILL.md"), "utf8"), "known-good\n");
  } finally {
    await rm(temp, {recursive: true, force: true});
  }
});
