import { readFile } from "node:fs/promises";
import path from "node:path";

type Skill = {
  id: string;
  source?: { type?: string; url?: string; ref?: string; path?: string };
  license?: string;
  provenance?: string;
};
type Registry = { skills: Skill[] };
type Approval = {
  skillId: string;
  upstreamUrl: string;
  upstreamRevision: string;
  license: string;
  licenseEvidenceUrl: string;
  redistributionAllowed: boolean;
  reviewedAt: string;
  reviewer: string;
  notes: string;
};
type ApprovalFile = { version: 1; approvals: Approval[] };

const root = process.cwd();
const registryPath = path.join(root, "registry", "skills.json");
const approvalsPath = path.join(root, "registry", "release-approvals.json");
const strict = process.argv.includes("--strict");

const registry = JSON.parse(await readFile(registryPath, "utf8")) as Registry;
let approvalFile: ApprovalFile = { version: 1, approvals: [] };
try {
  approvalFile = JSON.parse(await readFile(approvalsPath, "utf8")) as ApprovalFile;
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

if (!Array.isArray(registry.skills)) throw new Error("registry/skills.json must contain a skills array.");
if (approvalFile.version !== 1 || !Array.isArray(approvalFile.approvals)) {
  throw new Error("registry/release-approvals.json must use version 1 and an approvals array.");
}

const duplicateApprovals = new Set<string>();
const approvals = new Map<string, Approval>();
for (const approval of approvalFile.approvals) {
  if (!approval || typeof approval.skillId !== "string" || !approval.skillId.trim()) {
    throw new Error("Every release approval must include a non-empty skillId.");
  }
  if (duplicateApprovals.has(approval.skillId)) {
    throw new Error(`Duplicate release approval for skill: ${approval.skillId}`);
  }
  duplicateApprovals.add(approval.skillId);
  approvals.set(approval.skillId, approval);
}

const problems: string[] = [];
const problemsBySkill = new Map<string, string[]>();
const registryIds = new Set<string>();
const addProblem = (skillId: string, message: string) => {
  problems.push(message);
  if (registryIds.has(skillId)) {
    const current = problemsBySkill.get(skillId) ?? [];
    current.push(message);
    problemsBySkill.set(skillId, current);
  }
};
for (const skill of registry.skills) {
  if (registryIds.has(skill.id)) addProblem(skill.id, `${skill.id}: duplicate skill ID in registry`);
  registryIds.add(skill.id);
}
for (const id of approvals.keys()) {
  if (!registryIds.has(id)) problems.push(`${id}: approval exists for a skill absent from the registry`);
}

for (const skill of registry.skills) {
  const approval = approvals.get(skill.id);
  if (!approval) {
    addProblem(skill.id, `${skill.id}: no explicit redistribution approval record`);
    continue;
  }
  const required: (keyof Approval)[] = [
    "upstreamUrl", "upstreamRevision", "license", "licenseEvidenceUrl",
    "reviewedAt", "reviewer", "notes"
  ];
  for (const field of required) {
    if (typeof approval[field] !== "string" || !String(approval[field]).trim()) {
      addProblem(skill.id, `${skill.id}: approval field '${field}' is missing`);
    }
  }
  if (approval.redistributionAllowed !== true) {
    addProblem(skill.id, `${skill.id}: redistributionAllowed must be true`);
  }
  for (const [field, value] of [["upstreamUrl", approval.upstreamUrl], ["licenseEvidenceUrl", approval.licenseEvidenceUrl]] as const) {
    if (value) {
      try {
        if (new URL(value).protocol !== "https:") throw new Error("not HTTPS");
      } catch {
        addProblem(skill.id, `${skill.id}: ${field} must be a valid HTTPS URL`);
      }
    }
  }
  if (approval.upstreamRevision && !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(approval.upstreamRevision)) {
    addProblem(skill.id, `${skill.id}: upstreamRevision must be an immutable 40- or 64-character Git commit hash`);
  }
  if (approval.reviewedAt && (!/^\d{4}-\d{2}-\d{2}$/.test(approval.reviewedAt) || Number.isNaN(Date.parse(`${approval.reviewedAt}T00:00:00Z`)) || new Date(`${approval.reviewedAt}T00:00:00Z`).toISOString().slice(0, 10) !== approval.reviewedAt)) {
    addProblem(skill.id, `${skill.id}: reviewedAt must be a real ISO date (YYYY-MM-DD)`);
  }
  if (approval.license && skill.license && approval.license !== skill.license) {
    addProblem(skill.id, `${skill.id}: approval license does not match registry license (${skill.license})`);
  }
}

const summary = {
  skills: registry.skills.length,
  approvals: approvals.size,
  approved: registry.skills.filter(skill => approvals.get(skill.id)?.redistributionAllowed === true && !problemsBySkill.has(skill.id)).length,
  blockers: problems.length
};
console.log(JSON.stringify({ summary, blockers: problems }, null, 2));

if (strict && problems.length > 0) {
  console.error("Release blocked: every bundled skill needs a complete, evidence-backed approval.");
  process.exitCode = 1;
} else if (problems.length > 0) {
  // Keep stdout valid JSON for CI and scripts that consume the report.
  console.error("Report only. Use --strict to block a release when any blocker remains.");
}
