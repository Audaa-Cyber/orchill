import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
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

test("Git sparse checkout installs only the selected skill tree", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "orchill-git-test-"));
  try {
    const repo = path.join(temp, "source-repo");
    const registryRoot = path.join(temp, "registry");
    const cwd = path.join(temp, "project");
    await mkdir(path.join(repo, "skills", "demo", "references"), {recursive: true});
    await mkdir(path.join(repo, "skills", "unrelated"), {recursive: true});
    await mkdir(registryRoot, {recursive: true});
    await mkdir(cwd, {recursive: true});
    await writeFile(path.join(repo, "skills", "demo", "SKILL.md"), "# Demo from Git\n");
    await writeFile(path.join(repo, "skills", "demo", "references", "guide.md"), "Nested file\n");
    await writeFile(path.join(repo, "skills", "unrelated", "SKILL.md"), "# Do not install\n");
    execFileSync("git", ["init", "-b", "main", repo], {stdio: "ignore"});
    execFileSync("git", ["-C", repo, "config", "user.name", "Orchill Tests"]);
    execFileSync("git", ["-C", repo, "config", "user.email", "orchill-test@example.invalid"]);
    execFileSync("git", ["-C", repo, "add", "."]);
    execFileSync("git", ["-C", repo, "commit", "-m", "fixture"], {stdio: "ignore"});
    const skill: Skill = {
      id: "git-demo", name: "Git demo", description: "Fixture", category: "Tests",
      source: {type: "git", url: pathToFileURL(repo).href},
      skillPath: "skills/demo"
    };
    const installed = await installSkill(skill, registryRoot, "project", cwd);
    assert.equal(await readFile(path.join(installed, "SKILL.md"), "utf8"), "# Demo from Git\n");
    assert.equal(await readFile(path.join(installed, "references", "guide.md"), "utf8"), "Nested file\n");
    await assert.rejects(() => readFile(path.join(cwd, ".agents", "skills", "unrelated", "SKILL.md"), "utf8"));
  } finally {
    await rm(temp, {recursive: true, force: true});
  }
});
