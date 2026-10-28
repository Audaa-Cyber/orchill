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
const registryIds = new Set(registry.skills.map(skill => skill.id));
for (const id of approvals.keys()) {
  if (!registryIds.has(id)) problems.push(`${id}: approval exists for a skill absent from the registry`);
}

for (const skill of registry.skills) {
  const approval = approvals.get(skill.id);
  if (!approval) {
    problems.push(`${skill.id}: no explicit redistribution approval record`);
    continue;
  }
  const required: (keyof Approval)[] = [
    "upstreamUrl", "upstreamRevision", "license", "licenseEvidenceUrl",
    "reviewedAt", "reviewer", "notes"
  ];
  for (const field of required) {
    if (typeof approval[field] !== "string" || !String(approval[field]).trim()) {
      problems.push(`${skill.id}: approval field '${field}' is missing`);
    }
  }
  if (approval.redistributionAllowed !== true) {
    problems.push(`${skill.id}: redistributionAllowed must be true`);
  }
  if (approval.upstreamUrl && !/^https:\/\//i.test(approval.upstreamUrl)) {
    problems.push(`${skill.id}: upstreamUrl must use HTTPS`);
  }
  if (approval.licenseEvidenceUrl && !/^https:\/\//i.test(approval.licenseEvidenceUrl)) {
    problems.push(`${skill.id}: licenseEvidenceUrl must use HTTPS`);
  }
  if (approval.upstreamRevision && !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(approval.upstreamRevision)) {
    problems.push(`${skill.id}: upstreamRevision must be an immutable 40- or 64-character Git commit hash`);
  }
  if (approval.reviewedAt && !/^\d{4}-\d{2}-\d{2}$/.test(approval.reviewedAt)) {
    problems.push(`${skill.id}: reviewedAt must be an ISO date (YYYY-MM-DD)`);
  }
  if (approval.license && skill.license && approval.license !== skill.license) {
    problems.push(`${skill.id}: approval license does not match registry license (${skill.license})`);
  }
}

const summary = {
  skills: registry.skills.length,
  approvals: approvals.size,
  approved: registry.skills.filter(skill => approvals.get(skill.id)?.redistributionAllowed === true).length,
  blockers: problems.length
};
console.log(JSON.stringify({ summary, blockers: problems }, null, 2));

if (strict && problems.length > 0) {
  console.error("Release blocked: every bundled skill needs a complete, evidence-backed approval.");
  process.exitCode = 1;
} else if (problems.length > 0) {
  console.log("Report only. Use --strict to block a release when any blocker remains.");
}
