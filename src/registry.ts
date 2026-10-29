import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { safeRelativePath } from "./safety.js";
import type { Registry, Skill } from "./types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.resolve(here, "..");
export const defaultRegistryPath = path.join(packageRoot, "registry", "skills.json");

const TARGETS = new Set(["project", "agents", "claude", "codex"]);
const ROOT_KEYS = new Set(["$schema", "version", "skills"]);
const SKILL_KEYS = new Set([
  "id", "name", "description", "category", "tags", "source",
  "skillPath", "license", "provenance", "targets"
]);
const SOURCE_KEYS = new Set(["type", "path", "url", "ref"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>, label: string): void {
  const unknown = Object.keys(value).filter(key => !allowed.has(key));
  if (unknown.length) throw new Error(`${label} contains unsupported field(s): ${unknown.join(", ")}.`);
}

function requireNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

export async function loadRegistry(file = defaultRegistryPath): Promise<{ registry: Registry; root: string }> {
  const raw = await readFile(file, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Registry is not valid JSON: ${file}`);
  }
  if (!isRecord(parsed)) throw new Error("Registry root must be an object.");
  rejectUnknownKeys(parsed, ROOT_KEYS, "Registry");
  if (parsed.version !== 1 || !Array.isArray(parsed.skills)) {
    throw new Error("Unsupported registry format; expected version 1 and a skills array.");
  }

  const ids = new Set<string>();
  for (const item of parsed.skills) {
    validateSkill(item);
    if (ids.has(item.id)) throw new Error(`Duplicate skill id in registry: ${item.id}`);
    ids.add(item.id);
  }
  return { registry: parsed as unknown as Registry, root: path.dirname(path.resolve(file)) };
}

function validateSkill(value: unknown): asserts value is Skill {
  if (!isRecord(value)) throw new Error("Registry contains a non-object skill.");
  rejectUnknownKeys(value, SKILL_KEYS, "Skill");
  const s = value;
  if (typeof s.id !== "string" || !/^[a-z0-9][a-z0-9._-]*$/.test(s.id)) {
    throw new Error("Invalid skill id (use lowercase letters, numbers, dot, underscore, hyphen).");
  }
  for (const key of ["name", "description", "category"] as const) {
    requireNonEmptyString(s[key], `Skill ${s.id}: ${key}`);
  }
  requireNonEmptyString(s.skillPath, `Skill ${s.id}: skillPath`);
  if (s.skillPath.includes("\\\\") || s.skillPath.split("/").includes("..")) {
    throw new Error(`Skill ${s.id}: skillPath must use forward slashes and cannot contain parent-directory segments.`);
  }
  try {
    safeRelativePath(s.skillPath, `Skill ${s.id} path`);
  } catch (error) {
    throw new Error(`Skill ${s.id}: invalid skillPath: ${(error as Error).message}`);
  }

  if (!isRecord(s.source)) throw new Error(`Skill ${s.id}: source must be an object.`);
  rejectUnknownKeys(s.source, SOURCE_KEYS, `Skill ${s.id} source`);
  if (s.source.type === "local") {
    requireNonEmptyString(s.source.path, `Skill ${s.id}: local source.path`);
    if (s.source.url !== undefined || s.source.ref !== undefined) {
      throw new Error(`Skill ${s.id}: local sources may only define type and path.`);
    }
    if (path.isAbsolute(s.source.path) || s.source.path.includes("\0")) {
      throw new Error(`Skill ${s.id}: local source.path must be a relative path.`);
    }
  } else if (s.source.type === "git") {
    requireNonEmptyString(s.source.url, `Skill ${s.id}: git source.url`);
    if (s.source.path !== undefined) {
      throw new Error(`Skill ${s.id}: git sources must use skillPath, not source.path.`);
    }
    let url: URL;
    try {
      url = new URL(s.source.url);
    } catch {
      throw new Error(`Skill ${s.id}: invalid Git source URL.`);
    }
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.search || url.hash) {
      throw new Error(`Skill ${s.id}: Git source must be a clean HTTPS URL without credentials, query, or fragment.`);
    }
    if (s.source.ref !== undefined) requireNonEmptyString(s.source.ref, `Skill ${s.id}: source.ref`);
  } else {
    throw new Error(`Skill ${s.id}: source.type must be local or git.`);
  }

  for (const key of ["license", "provenance"] as const) {
    if (s[key] !== undefined) requireNonEmptyString(s[key], `Skill ${s.id}: ${key}`);
  }
  if (s.tags !== undefined) {
    if (!Array.isArray(s.tags) || s.tags.some(tag => typeof tag !== "string" || !tag.trim())) {
      throw new Error(`Skill ${s.id}: tags must be an array of non-empty strings.`);
    }
    if (new Set(s.tags).size !== s.tags.length) throw new Error(`Skill ${s.id}: tags must not contain duplicates.`);
  }
  if (s.targets !== undefined) {
    if (!Array.isArray(s.targets) || s.targets.some(target => typeof target !== "string" || !TARGETS.has(target))) {
      throw new Error(`Skill ${s.id}: targets must contain only project, agents, claude, or codex.`);
    }
    if (new Set(s.targets).size !== s.targets.length) throw new Error(`Skill ${s.id}: targets must not contain duplicates.`);
  }
}
