import path from "node:path";
import { lstat, mkdir, realpath } from "node:fs/promises";

export function safeRelativePath(value: string, label: string): string {
  if (!value || value.includes("\0") || path.isAbsolute(value)) throw new Error(`${label} must be a safe relative path.`);
  const normalized = path.normalize(value);
  if (normalized === ".." || normalized.startsWith(`..${path.sep}`) || normalized.split(path.sep).includes("..")) {
    throw new Error(`${label} cannot escape its parent directory: ${value}`);
  }
  return normalized === "." ? "." : normalized;
}

export async function ensureInside(root: string, candidate: string): Promise<string> {
  const rootReal = await realpath(root);
  const resolved = path.resolve(candidate);
  const relative = path.relative(rootReal, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Path escapes destination root: ${candidate}`);
  }
  return resolved;
}

export async function ensureNoSymlinkParents(root: string, target: string): Promise<void> {
  const rootAbs = path.resolve(root);
  const targetAbs = path.resolve(target);
  const rel = path.relative(rootAbs, targetAbs);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw new Error("Destination escapes target root.");
  await mkdir(rootAbs, { recursive: true });
  let cursor = rootAbs;
  for (const part of rel.split(path.sep).filter(Boolean).slice(0, -1)) {
    cursor = path.join(cursor, part);
    try {
      const info = await lstat(cursor);
      if (info.isSymbolicLink()) throw new Error(`Refusing to write through symlink: ${cursor}`);
      if (!info.isDirectory()) throw new Error(`Destination parent is not a directory: ${cursor}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
      throw error;
    }
  }
}
