export type ProvenanceSkill = {
  id: string;
  name: string;
  category: string;
  source?: { type?: string; path?: string; url?: string; ref?: string };
  license?: string;
  provenance?: string;
};
export type ProvenanceRegistry = { version: number; skills: ProvenanceSkill[] };
export type ProvenanceApproval = {
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
export type ProvenanceApprovalFile = { version: number; approvals: ProvenanceApproval[] };

export type ProvenanceInventoryRow = {
  id: string; name: string; category: string; sourceType: string; localPath: string;
  registrySourceUrl: string; registrySourceRef: string; declaredLicense: string; provenanceNotes: string;
  approvalRecordPresent: boolean; redistributionAllowed: boolean | null; upstreamUrl: string;
  upstreamRevision: string; licenseEvidenceUrl: string; reviewDate: string; reviewer: string;
  reviewNotes: string; missingEvidence: string[];
};

export function buildProvenanceInventory(registry: ProvenanceRegistry, ledger: ProvenanceApprovalFile): ProvenanceInventoryRow[] {
  const approvals = new Map<string, ProvenanceApproval>((ledger.approvals ?? []).map(item => [item.skillId, item] as const));
  return registry.skills.map(skill => {
    const approval = approvals.get(skill.id);
    const upstreamUrl = approval?.upstreamUrl?.trim() ?? "";
    const upstreamRevision = approval?.upstreamRevision?.trim() ?? "";
    const licenseEvidenceUrl = approval?.licenseEvidenceUrl?.trim() ?? "";
    const reviewDate = approval?.reviewedAt?.trim() ?? "";
    const reviewer = approval?.reviewer?.trim() ?? "";
    const reviewNotes = approval?.notes?.trim() ?? "";
    const missingEvidence: string[] = [];
    if (!upstreamUrl) missingEvidence.push("upstreamUrl");
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(upstreamRevision)) missingEvidence.push("upstreamRevision (full commit SHA)");
    if (!(approval?.license ?? "").trim()) missingEvidence.push("reviewed license");
    if (!licenseEvidenceUrl) missingEvidence.push("licenseEvidenceUrl");
    if (approval?.redistributionAllowed !== true) missingEvidence.push("explicit redistribution permission");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate) || Number.isNaN(Date.parse(reviewDate + "T00:00:00Z")) || new Date(reviewDate + "T00:00:00Z").toISOString().slice(0, 10) !== reviewDate) missingEvidence.push("reviewDate");
    if (!reviewer) missingEvidence.push("reviewer");
    if (!reviewNotes) missingEvidence.push("reviewNotes");
    if (!skill.license) missingEvidence.push("registry declared license");
    else if (approval?.license && approval.license !== skill.license) missingEvidence.push("license mismatch");
    for (const [field, value] of [["upstreamUrl", upstreamUrl], ["licenseEvidenceUrl", licenseEvidenceUrl]] as const) {
      if (!value) continue;
      try { if (new URL(value).protocol !== "https:") missingEvidence.push(field + " must be HTTPS"); }
      catch { missingEvidence.push(field + " must be a valid HTTPS URL"); }
    }
    return {
      id: skill.id, name: skill.name, category: skill.category, sourceType: skill.source?.type ?? "unknown",
      localPath: skill.source?.type === "local" ? skill.source.path ?? "" : "",
      registrySourceUrl: skill.source?.url ?? "", registrySourceRef: skill.source?.ref ?? "",
      declaredLicense: skill.license ?? "", provenanceNotes: skill.provenance ?? "",
      approvalRecordPresent: Boolean(approval), redistributionAllowed: approval ? approval.redistributionAllowed === true : null,
      upstreamUrl, upstreamRevision, licenseEvidenceUrl, reviewDate, reviewer, reviewNotes, missingEvidence
    };
  }).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
