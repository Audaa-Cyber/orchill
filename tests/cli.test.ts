import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "src", "cli.ts");

function run(args: string[], cwd = root) {
  return spawnSync(process.execPath, ["--import", "tsx", cli, ...args], {
    cwd,
    encoding: "utf8",
    env: process.env,
  });
}

test("help documents exactly the canonical public command family", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0, result.stderr);
  for (const command of [
    "list [category]", "info <name>", "add <skill>", "add <category>", "add catalogue", "update",
    "remove <name>", "check [name]", "init", "import <file>",
  ]) assert.match(result.stdout, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(result.stdout, /\b(?:ls|up|rm|audit|registry|targets|mcp|import-commands)\b/);
});

test("version is available with --version and -v", () => {
  const long = run(["--version"]);
  const short = run(["-v"]);
  assert.equal(long.status, 0, long.stderr);
  assert.equal(short.status, 0, short.stderr);
  assert.equal(short.stdout.trim(), long.stdout.trim());
});

test("init creates project skill directory and appends instructions without replacing existing text", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "orchill-init-test-"));
  try {
    const agents = path.join(temp, "AGENTS.md");
    const original = "# My existing agent rules\n\nKeep this content exactly.\n";
    const { writeFile, access } = await import("node:fs/promises");
    await writeFile(agents, original, "utf8");
    const first = run(["init", "--cwd", temp]);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /Prepared .*\.agents[\\/]skills/);
    assert.equal(await readFile(agents, "utf8").then(text => text.startsWith(original.trimEnd())), true);
    assert.match(await readFile(agents, "utf8"), /<!-- orchill:begin -->[\s\S]*<!-- orchill:end -->/);
    await access(path.join(temp, ".agents", "skills"));
    const second = run(["init", "--cwd", temp]);
    assert.equal(second.status, 0, second.stderr);
    assert.equal((await readFile(agents, "utf8")).match(/<!-- orchill:begin -->/g)?.length, 1);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("removed aliases, extra subcommands, and non-canonical catalogue spelling are rejected", () => {
  for (const command of ["ls", "up", "rm", "audit", "registry", "targets", "mcp", "import-commands", "help"]) {
    const result = run([command]);
    assert.notEqual(result.status, 0, `unexpectedly accepted command: ${command}`);
  }
});
