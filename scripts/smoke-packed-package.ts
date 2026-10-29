import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function run(args: string[], cwd: string): string {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("npm_execpath is not set; run this smoke test through npm.");
  const result = spawnSync(process.execPath, [npmCli, ...args], { cwd, encoding: "utf8", timeout: 180_000, windowsHide: true });
  if (result.status !== 0) throw new Error(`npm ${args.join(" ")} failed (status ${result.status}).\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
const root = process.cwd();
const temp = await mkdtemp(path.join(os.tmpdir(), "orchill-packed-smoke-"));
try {
  const packDir = path.join(temp, "pack");
  const installDir = path.join(temp, "install");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(packDir);
  await mkdir(installDir);
  const output = run(["pack", "--json", "--pack-destination", packDir], root);
  const packed = JSON.parse(output) as Array<{ filename: string; files: Array<{ path: string }> }>;
  const tarball = packed[0]?.filename;
  assert.ok(tarball, "npm pack must produce a tarball");
  assert.ok(packed[0]?.files.some(file => file.path === "dist/cli.js"), "tarball must include dist/cli.js");
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as { version: string; bin?: Record<string, string> };
  assert.equal(packageJson.bin?.orchill, "dist/cli.js", "source package must use npm-normalized executable path to avoid publish-time correction");
  run(["install", "--prefix", installDir, "--no-audit", "--no-fund", path.join(packDir, tarball)], root);
  const installedPackage = JSON.parse(await readFile(path.join(installDir, "node_modules", "orchill", "package.json"), "utf8")) as { bin?: Record<string, string> };
  assert.equal(installedPackage.bin?.orchill, "dist/cli.js", "packed package metadata must preserve the normalized executable mapping");
  const executable = path.join(installDir, "node_modules", ".bin", process.platform === "win32" ? "orchill.cmd" : "orchill");
  const smoke = spawnSync(executable, ["--version"], { cwd: temp, encoding: "utf8", timeout: 15_000, windowsHide: true, shell: process.platform === "win32" });
  assert.equal(smoke.status, 0, `installed orchill --version failed: ${smoke.stderr || smoke.stdout}`);
  assert.equal(smoke.stdout.trim(), packageJson.version, "installed executable must print the package version");
  console.log("Packed npm tarball installs cleanly and exposes a working orchill executable.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
