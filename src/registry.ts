import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Registry, Skill } from "./types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.resolve(here, "..");
export const defaultRegistryPath = path.join(packageRoot, "registry", "skills.json");

export async function loadRegistry(file = defaultRegistryPath): Promise<{ registry: Registry; root: string }> {
  const raw = await readFile(file, "utf8");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error(`Registry is not valid JSON: ${file}`); }
  if (!parsed || typeof parsed !== "object") throw new Error("Registry root must be an object.");
  const candidate = parsed as Partial<Registry>;
  if (candidate.version !== 1 || !Array.isArray(candidate.skills)) throw new Error("Unsupported registry format; expected version 1 and a skills array.");
  const ids = new Set<string>();
  for (const item of candidate.skills) {
    validateSkill(item);
    if (ids.has(item.id)) throw new Error(`Duplicate skill id in registry: ${item.id}`);
    ids.add(item.id);
  }
  return { registry: candidate as Registry, root: path.dirname(path.resolve(file)) };
}

function validateSkill(value: unknown): asserts value is Skill {
  if (!value || typeof value !== "object") throw new Error("Registry contains a non-object skill.");
  const s = value as Partial<Skill>;
  if (typeof s.id !== "string" || !/^[a-z0-9][a-z0-9._-]*$/.test(s.id)) throw new Error("Invalid skill id (use lowercase letters, numbers, dot, underscore, hyphen).");
  for (const key of ["name", "description", "category", "skillPath"] as const) {
    if (typeof s[key] !== "string" || !s[key]!.trim()) throw new Error(`Skill ${s.id}: ${key} must be a non-empty string.`);
  }
  if (!s.source || !["local", "git"].includes(s.source.type)) throw new Error(`Skill ${s.id}: source.type must be local or git.`);
  if (s.source.type === "local" && (typeof s.source.path !== "string" || !s.source.path.trim())) {
    throw new Error(`Skill ${s.id}: local source requires source.path.`);
  }
  if (s.source.type === "git") {
    if (typeof s.source.url !== "string" || !s.source.url.trim()) {
      throw new Error(`Skill ${s.id}: git source requires an HTTPS URL.`);
    }
    let url: URL;
    try { url = new URL(s.source.url); } catch { throw new Error(`Skill ${s.id}: invalid Git source URL.`); }
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      throw new Error(`Skill ${s.id}: Git source must be HTTPS and must not embed credentials.`);
    }
  }
  if (s.tags !== undefined && (!Array.isArray(s.tags) || s.tags.some(tag => typeof tag !== "string"))) {
    throw new Error(`Skill ${s.id}: tags must be an array of strings.`);
  }
  if (s.targets !== undefined && (!Array.isArray(s.targets) || s.targets.some(target => typeof target !== "string"))) {
    throw new Error(`Skill ${s.id}: targets must be an array of strings.`);
  }
}
