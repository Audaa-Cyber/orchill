import path from "node:path";
import { lstat } from "node:fs/promises";

export function safeRelativePath(value: string, label: string): string {
  if (
    !value ||
    value.includes("\0") ||
    path.isAbsolute(value) ||
    value.startsWith("\\") ||
    /^[a-zA-Z]:/.test(value)
  ) throw new Error(`${label} must be a safe relative path.`);

  // Registry paths use POSIX separators on every OS. Normalize with
  // path.posix so callers and tests get stable results on Windows too.
  const normalized = path.posix.normalize(value.replace(/\\/g, "/"));
  if (normalized === ".." || normalized.startsWith("../") || normalized.split("/").includes("..")) {
    throw new Error(`${label} cannot escape its parent directory: ${value}`);
  }
  return normalized === "." ? "." : normalized;
}

export async function ensureInside(root: string, candidate: string): Promise<string> {
  const rootAbs = path.resolve(root);
  const resolved = path.resolve(candidate);
  const relative = path.relative(rootAbs, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Path escapes destination root: ${candidate}`);
  }
  return resolved;
}

export async function ensureNoSymlinkParents(root: string, target: string): Promise<void> {
  const rootAbs = path.resolve(root);
  const targetAbs = path.resolve(target);
  const rel = path.relative(rootAbs, targetAbs);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error("Destination escapes target root.");
  }

  // Inspect existing ancestors before mkdir: creating through a symlink can
  // otherwise create directories outside the project before detection.
  const filesystemRoot = path.parse(rootAbs).root;
  const rootParts = rootAbs.slice(filesystemRoot.length).split(path.sep).filter(Boolean);
  const parentParts = rel.split(path.sep).filter(Boolean).slice(0, -1);
  let cursor = filesystemRoot;
  for (const part of [...rootParts, ...parentParts]) {
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
