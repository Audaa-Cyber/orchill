import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildProvenanceInventory } from "../src/provenance.js";
import type { ProvenanceApprovalFile, ProvenanceRegistry, ProvenanceInventoryRow } from "../src/provenance.js";

const root = process.cwd();
const registryPath = path.resolve(process.argv.find(arg => arg.startsWith("--registry="))?.slice("--registry=".length) ?? "registry/skills.json");
const outputArg = process.argv.find(arg => arg.startsWith("--output="));
const outputPath = outputArg ? path.resolve(outputArg.slice("--output=".length)) : undefined;
const format = process.argv.find(arg => arg.startsWith("--format="))?.slice("--format=".length) ?? "json";
if (format !== "json" && format !== "csv") throw new Error("--format must be json or csv");

const registry = JSON.parse(await readFile(registryPath, "utf8")) as ProvenanceRegistry;
let ledger: ProvenanceApprovalFile = { version: 1, approvals: [] };
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
