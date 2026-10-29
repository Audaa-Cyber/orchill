import { cp, lstat, mkdtemp, mkdir, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
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

export function categorySlug(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function targetRoot(target: string, cwd = process.cwd()): string {
  switch (target) {
    case "project":
    case "agents":
    case "codex":
      return path.join(cwd, ".agents", "skills");
    case "claude":
      return path.join(cwd, ".claude", "skills");
    default:
      throw new Error(`Unknown target "${target}". Use project, agents, claude, or codex.`);
  }
}

function installDestination(id: string, target: string, cwd: string, category?: string): string {
  const safeId = safeRelativePath(id, "Skill id");
  if (safeId !== id) throw new Error("Skill id must be a single directory name.");
  const root = targetRoot(target, cwd);
  if (!category) throw new Error("Skill category is required for managed installations.");
  const slug = categorySlug(category);
  if (!slug) throw new Error("Skill category must produce a non-empty directory name.");
  return path.join(root, slug, safeId);
}

export async function installSkill(skill: Skill, registryRoot: string, target: string, cwd: string, force = false): Promise<string> {
  const projectRoot = await realpath(cwd);
  const root = targetRoot(target, projectRoot);
  const id = safeRelativePath(skill.id, "Skill id");
  if (id !== skill.id) throw new Error("Skill id must be a single directory name.");
  const category = categorySlug(skill.category);
  if (!category) throw new Error("Skill category must produce a non-empty directory name.");
  const destination = path.join(root, category, id);
  await ensureNoSymlinkParents(root, destination);
  await mkdir(path.dirname(destination), { recursive: true });
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
    const markerPath = path.join(staged, INSTALL_MARKER);
    try {
      await lstat(markerPath);
      throw new Error(`Source skill reserves the protected file ${INSTALL_MARKER}; refusing to overwrite it.`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await writeFile(markerPath, JSON.stringify({
      version: 2,
      skillId: id,
      category,
      target
    }, null, 2) + "\n", { flag: "wx" });

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

const INSTALL_MARKER = ".orchill-install.json";

interface InstallMarker {
  version: 2;
  skillId: string;
  category: string;
  target: string;
}

export interface SkillVerification {
  skillId: string;
  destination: string;
  installed: boolean;
  managed: boolean;
  hasSkillFile: boolean;
  problems: string[];
}

export async function verifySkillInstallation(id: string, target: string, cwd: string, category: string): Promise<SkillVerification> {
  const projectRoot = await realpath(cwd);
  const destination = installDestination(id, target, projectRoot, category);
  const problems: string[] = [];
  let installed = false;
  let managed = false;
  let hasSkillFile = false;

  try {
    const info = await lstat(destination);
    if (info.isSymbolicLink() || !info.isDirectory()) {
      problems.push("Installation destination is not a regular directory.");
    } else {
      installed = true;
      const markerPath = path.join(destination, INSTALL_MARKER);
      try {
        const markerInfo = await lstat(markerPath);
        if (!markerInfo.isFile() || markerInfo.isSymbolicLink()) throw new Error("invalid marker");
        const marker = JSON.parse(await (await import("node:fs/promises")).readFile(markerPath, "utf8")) as Partial<InstallMarker>;
        managed = marker.version === 2 && marker.skillId === id && marker.category === categorySlug(category) && marker.target === target;
      } catch {
        managed = false;
      }
      if (!managed) problems.push("Missing or invalid Orchill installation marker; this directory is unmanaged.");
      try {
        const skillFile = await lstat(path.join(destination, "SKILL.md"));
        hasSkillFile = skillFile.isFile() && !skillFile.isSymbolicLink();
      } catch {
        hasSkillFile = false;
      }
      if (!hasSkillFile) problems.push("SKILL.md is missing or is not a regular file.");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      problems.push("Skill is not installed.");
    } else {
      throw error;
    }
  }

  return { skillId: id, destination, installed, managed, hasSkillFile, problems };
}

export async function uninstallSkill(id: string, target: string, cwd: string, category: string): Promise<string> {
  const projectRoot = await realpath(cwd);
  const destination = installDestination(id, target, projectRoot, category);
  const root = targetRoot(target, projectRoot);
  await ensureNoSymlinkParents(root, destination);
  const checked = await verifySkillInstallation(id, target, projectRoot, category);
  if (!checked.installed) throw new Error(`Cannot uninstall "${id}": skill is not installed.`);
  if (!checked.managed) throw new Error(`Refusing to uninstall "${id}": no valid Orchill installation marker.`);
  const info = await lstat(destination);
  if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Refusing to remove non-directory installation: ${destination}`);
  await rm(destination, { recursive: true, force: false });
  return destination;
}
