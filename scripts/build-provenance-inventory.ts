import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Skill = {
  id: string;
  name: string;
  category: string;
  source?: { type?: string; path?: string; url?: string; ref?: string };
  license?: string;
  provenance?: string;
};
type Registry = { version: number; skills: Skill[] };
type Approval = {
  skillId: string;
  upstreamUrl?: string;
  upstreamRevision?: string;
  license?: string;
  licenseEvidenceUrl?: string;
  redistributionAllowed?: boolean;
  reviewedAt?: string;
  reviewer?: string;
  notes?: string;
};
type ApprovalFile = { version: number; approvals: Approval[] };

export type ProvenanceInventoryRow = {
  id: string;
  name: string;
  category: string;
  sourceType: string;
  localPath: string;
  registrySourceUrl: string;
  registrySourceRef: string;
  declaredLicense: string;
  provenanceNotes: string;
  approvalRecordPresent: boolean;
  redistributionAllowed: boolean | null;
  upstreamUrl: string;
  upstreamRevision: string;
  licenseEvidenceUrl: string;
  reviewDate: string;
  reviewer: string;
  reviewNotes: string;
  missingEvidence: string[];
};

export function buildProvenanceInventory(registry: Registry, ledger: ApprovalFile): ProvenanceInventoryRow[] {
  const approvals = new Map<string, Approval>((ledger.approvals ?? []).map(item => [item.skillId, item] as const));
  return registry.skills.map(skill => {
    const approval = approvals.get(skill.id);
    const values = {
      upstreamUrl: approval?.upstreamUrl?.trim() ?? "",
      upstreamRevision: approval?.upstreamRevision?.trim() ?? "",
      licenseEvidenceUrl: approval?.licenseEvidenceUrl?.trim() ?? "",
      reviewDate: approval?.reviewedAt?.trim() ?? "",
      reviewer: approval?.reviewer?.trim() ?? "",
      reviewNotes: approval?.notes?.trim() ?? ""
    };
    const missingEvidence: string[] = [];
    if (!values.upstreamUrl) missingEvidence.push("upstreamUrl");
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(values.upstreamRevision)) missingEvidence.push("upstreamRevision (full commit SHA)");
    if (!(approval?.license ?? "").trim()) missingEvidence.push("reviewed license");
    if (!values.licenseEvidenceUrl) missingEvidence.push("licenseEvidenceUrl");
    if (approval?.redistributionAllowed !== true) missingEvidence.push("explicit redistribution permission");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.reviewDate) || Number.isNaN(Date.parse(values.reviewDate + "T00:00:00Z")) || new Date(values.reviewDate + "T00:00:00Z").toISOString().slice(0, 10) !== values.reviewDate) missingEvidence.push("reviewDate");
    if (!values.reviewer) missingEvidence.push("reviewer");
    if (!values.reviewNotes) missingEvidence.push("reviewNotes");
    if (!skill.license) missingEvidence.push("registry declared license");
    else if (approval?.license && approval.license !== skill.license) missingEvidence.push("license mismatch");
    for (const [field, value] of [["upstreamUrl", values.upstreamUrl], ["licenseEvidenceUrl", values.licenseEvidenceUrl]] as const) {
      if (value) {
        try { if (new URL(value).protocol !== "https:") missingEvidence.push(field + " must be HTTPS"); }
        catch { missingEvidence.push(field + " must be a valid HTTPS URL"); }
      }
    }
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      sourceType: skill.source?.type ?? "unknown",
      localPath: skill.source?.type === "local" ? skill.source.path ?? "" : "",
      registrySourceUrl: skill.source?.url ?? "",
      registrySourceRef: skill.source?.ref ?? "",
      declaredLicense: skill.license ?? "",
      provenanceNotes: skill.provenance ?? "",
      approvalRecordPresent: Boolean(approval),
      redistributionAllowed: approval ? approval.redistributionAllowed === true : null,
      ...values,
      missingEvidence
    };
  }).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

const root = process.cwd();
const registryPath = path.resolve(process.argv.find(arg => arg.startsWith("--registry="))?.slice("--registry=".length) ?? "registry/skills.json");
const outputArg = process.argv.find(arg => arg.startsWith("--output="));
const outputPath = outputArg ? path.resolve(outputArg.slice("--output=".length)) : undefined;
const format = process.argv.find(arg => arg.startsWith("--format="))?.slice("--format=".length) ?? "json";
if (format !== "json" && format !== "csv") throw new Error("--format must be json or csv");

const registry = JSON.parse(await readFile(registryPath, "utf8")) as Registry;
let ledger: ApprovalFile = { version: 1, approvals: [] };
try {
  ledger = JSON.parse(await readFile(path.join(path.dirname(registryPath), "release-approvals.json"), "utf8")) as ApprovalFile;
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
if (!Array.isArray(registry.skills)) throw new Error("Registry must contain a skills array.");
if (!Array.isArray(ledger.approvals)) throw new Error("Release approval ledger must contain an approvals array.");

const rows = buildProvenanceInventory(registry, ledger);
const summary = {
  skills: rows.length,
  withApprovalRecord: rows.filter(row => row.approvalRecordPresent).length,
  withExplicitRedistributionPermission: rows.filter(row => row.redistributionAllowed === true).length,
  withNoMissingEvidence: rows.filter(row => row.missingEvidence.length === 0).length,
  requiringReview: rows.filter(row => row.missingEvidence.length > 0).length
};
let output: string;
if (format === "json") {
  output = JSON.stringify({ generatedFrom: path.relative(root, registryPath), summary, skills: rows }, null, 2) + "\n";
} else {
  const columns: (keyof ProvenanceInventoryRow)[] = [
    "id", "name", "category", "sourceType", "localPath", "registrySourceUrl", "registrySourceRef",
    "declaredLicense", "provenanceNotes", "approvalRecordPresent", "redistributionAllowed",
    "upstreamUrl", "upstreamRevision", "licenseEvidenceUrl", "reviewDate", "reviewer", "reviewNotes", "missingEvidence"
  ];
  const csvCell = (value: unknown) => {
    const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  };
  output = [columns.join(","), ...rows.map(row => columns.map(column => csvCell(row[column])).join(","))].join("\n") + "\n";
}
if (outputPath) {
  await writeFile(outputPath, output, { flag: "w" });
  console.error(`Wrote ${rows.length} skill records to ${outputPath}`);
} else {
  process.stdout.write(output);
}
