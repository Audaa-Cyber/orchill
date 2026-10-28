import { cp, lstat, mkdtemp, mkdir, readdir, realpath, rename, rm, stat, readFile, writeFile } from "node:fs/promises";
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
    case "codex": return path.join(cwd, ".agents", "skills");
    case "agents": return path.join(cwd, ".agents", "skills");
    default: throw new Error(`Unknown target "${target}". Use project, agents, claude, or codex.`);
  }
}

export async function installSkill(skill: Skill, registryRoot: string, target: string, cwd: string, force = false): Promise<string> {
  const projectRoot = await realpath(cwd);
  const root = targetRoot(target, projectRoot);
  const id = safeRelativePath(skill.id, "Skill id");
  if (id !== skill.id) throw new Error("Skill id must be a single directory name.");
  const destination = path.join(root, id);
  await ensureNoSymlinkParents(root, destination);
  await mkdir(root, { recursive: true });
  await ensureNoSymlinkParents(root, destination);

  try {
    const info = await lstat(destination);
    if (info.isSymbolicLink()) throw new Error(`Refusing to replace a symlink: ${destination}`);
    if (!force) throw new Error(`Already exists: ${destination}. Use --force to replace it.`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const stageParent = await mkdtemp(path.join(root, ".orchill-stage-"));
  const staged = path.join(stageParent, id);
  let temporary = "";
  let backup = "";
  let movedOld = false;
  try {
    let sourceRoot: string;
    if (skill.source.type === "local") {
      sourceRoot = path.resolve(registryRoot, skill.source.path!);
    } else {
      temporary = await mkdtemp(path.join(os.tmpdir(), "orchill-"));
      const cloneDir = path.join(temporary, "repo");
      await run("git", ["clone", "--depth", "1", "--filter=blob:none", "--sparse", skill.source.url!, cloneDir]);
      if (skill.source.ref) {
        await run("git", ["-C", cloneDir, "fetch", "--depth", "1", "origin", skill.source.ref]);
        await run("git", ["-C", cloneDir, "checkout", "--detach", "FETCH_HEAD"]);
      }
      const relative = safeRelativePath(skill.skillPath, "Skill path");
      await run("git", ["-C", cloneDir, "sparse-checkout", "set", "--", relative]);
      await run("git", ["-C", cloneDir, "checkout"]);
      sourceRoot = cloneDir;
    }
    const skillPath = safeRelativePath(skill.skillPath, "Skill path");
    const source = skillPath === "." ? sourceRoot : path.resolve(sourceRoot, skillPath);
    const sourceInfo = await stat(source);
    if (!sourceInfo.isDirectory()) throw new Error(`Skill path is not a directory: ${source}`);
    await copyTree(source, staged);
    await writeFile(path.join(staged, ".orchill-install.json"), JSON.stringify({
      schemaVersion: 1,
      skillId: skill.id,
      installedAt: new Date().toISOString(),
      sourceType: skill.source.type,
      sourceUrl: skill.source.type === "git" ? skill.source.url : undefined,
      sourceRef: skill.source.type === "git" ? skill.source.ref : undefined
    }, null, 2) + "\n", { flag: "wx" });

    // Recheck immediately before changing the live destination.
    try {
      const current = await lstat(destination);
      if (current.isSymbolicLink()) throw new Error(`Refusing to replace a symlink: ${destination}`);
      if (!force) throw new Error(`Already exists: ${destination}. Use --force to replace it.`);
      backup = path.join(stageParent, "previous-install");
      await rename(destination, backup);
      movedOld = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await rename(staged, destination);
    // The new install is now committed. Cleanup failures must not roll it back.
    const hadBackup = movedOld;
    movedOld = false;
    if (hadBackup) await rm(backup, { recursive: true, force: true }).catch(() => undefined);
    return destination;
  } catch (error) {
    if (movedOld) {
      try {
        await lstat(destination);
        await rm(destination, { recursive: true, force: true });
      } catch (check) {
        if ((check as NodeJS.ErrnoException).code !== "ENOENT") throw check;
      }
      await rename(backup, destination).catch(() => undefined);
    }
    throw error;
  } finally {
    await rm(stageParent, { recursive: true, force: true }).catch(() => undefined);
    if (temporary) await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
  }
}


export interface InstallationVerification {
  skillId: string;
  destination: string;
  installed: boolean;
  managed: boolean;
  hasSkillFile: boolean;
  problems: string[];
}

export async function verifySkillInstallation(skillId: string, target: string, cwd: string): Promise<InstallationVerification> {
  const projectRoot = await realpath(cwd);
  const root = targetRoot(target, projectRoot);
  const id = safeRelativePath(skillId, "Skill id");
  if (id !== skillId) throw new Error("Skill id must be a single directory name.");
  const destination = path.join(root, id);
  await ensureNoSymlinkParents(root, destination);
  const problems: string[] = [];
  let info;
  try { info = await lstat(destination); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { skillId, destination, installed: false, managed: false, hasSkillFile: false, problems: ["Installation directory does not exist."] };
    }
    throw error;
  }
  if (info.isSymbolicLink() || !info.isDirectory()) {
    return { skillId, destination, installed: false, managed: false, hasSkillFile: false, problems: ["Destination is not a regular directory."] };
  }
  let managed = false;
  try {
    const marker = JSON.parse(await readFile(path.join(destination, ".orchill-install.json"), "utf8")) as { schemaVersion?: unknown; skillId?: unknown };
    managed = marker.schemaVersion === 1 && marker.skillId === skillId;
    if (!managed) problems.push("Orchill installation marker is invalid or belongs to another skill.");
  } catch {
    problems.push("Orchill installation marker is missing or unreadable.");
  }
  let hasSkillFile = false;
  try { hasSkillFile = (await lstat(path.join(destination, "SKILL.md"))).isFile(); }
  catch { /* reported below */ }
  if (!hasSkillFile) problems.push("SKILL.md is missing.");
  return { skillId, destination, installed: problems.length === 0, managed, hasSkillFile, problems };
}

export async function uninstallSkill(skillId: string, target: string, cwd: string): Promise<string> {
  const result = await verifySkillInstallation(skillId, target, cwd);
  if (!result.managed) throw new Error(`Refusing to uninstall ${skillId}: no valid Orchill installation marker was found.`);
  const info = await lstat(result.destination);
  if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Refusing to remove a non-directory or symlink: ${result.destination}`);
  await rm(result.destination, { recursive: true, force: false });
  return result.destination;
}
