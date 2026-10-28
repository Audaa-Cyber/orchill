import { cp, lstat, mkdtemp, mkdir, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { Skill } from "./types.js";
import { ensureNoSymlinkParents, safeRelativePath } from "./safety.js";

function run(command: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", shell: false, windowsHide: true });
    child.once("error", reject);
    child.once("close", code => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

async function copyTree(source: string, destination: string): Promise<void> {
  const info = await lstat(source);
  if (info.isSymbolicLink()) throw new Error(`Refusing to copy symbolic link: ${source}`);
  if (info.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(source)) {
      if (entry === ".git" || entry === "node_modules") continue;
      await copyTree(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }
  if (!info.isFile()) return;
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { errorOnExist: true, force: false, preserveTimestamps: true });
}

export function targetRoot(target: string, cwd = process.cwd()): string {
  switch (target) {
    case "project": return path.join(cwd, ".agents", "skills");
    case "claude": return path.join(cwd, ".claude", "skills");
    case "codex": return path.join(cwd, ".codex", "skills");
    case "agents": return path.join(cwd, ".agents", "skills");
    default: throw new Error(`Unknown target "${target}". Use project, agents, claude, or codex.`);
  }
}

export async function installSkill(skill: Skill, registryRoot: string, target: string, cwd: string, force = false): Promise<string> {
  const root = targetRoot(target, cwd);
  const id = safeRelativePath(skill.id, "Skill id");
  const destination = path.join(root, id);
  await ensureNoSymlinkParents(root, destination);
  try {
    await lstat(destination);
    if (!force) throw new Error(`Already exists: ${destination}. Use --force to replace it.`);
    // Never follow a symlink or remove a path outside the selected skills root.
    const info = await lstat(destination);
    if (info.isSymbolicLink()) throw new Error(`Refusing to replace a symlink: ${destination}`);
    await rm(destination, { recursive: true, force: false });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  let sourceRoot = "";
  let temporary = "";
  try {
    if (skill.source.type === "local") {
      sourceRoot = path.resolve(registryRoot, skill.source.path!);
    } else {
      temporary = await mkdtemp(path.join(os.tmpdir(), "orchill-"));
      const cloneDir = path.join(temporary, "repo");
      const ref = skill.source.ref;
      const args = ["clone", "--depth", "1", "--filter=blob:none", "--sparse"];
      if (ref) args.push("--branch", ref);
      args.push(skill.source.url!, cloneDir);
      await run("git", args);
      const relative = safeRelativePath(skill.skillPath, "Skill path");
      await run("git", ["-C", cloneDir, "sparse-checkout", "set", "--", relative]);
      await run("git", ["-C", cloneDir, "checkout"]);
      sourceRoot = path.resolve(cloneDir, relative);
    }
    const skillPath = safeRelativePath(skill.skillPath, "Skill path");
    const source = skillPath === "." ? sourceRoot : path.resolve(sourceRoot, skillPath);
    const sourceInfo = await stat(source);
    if (!sourceInfo.isDirectory()) throw new Error(`Skill path is not a directory: ${source}`);
    await mkdir(root, { recursive: true });
    await copyTree(source, destination);
    return destination;
  } catch (error) {
    await rm(destination, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true });
  }
}
