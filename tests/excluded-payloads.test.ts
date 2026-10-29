import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const categorySlug = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const registry = JSON.parse(readFileSync("registry/skills.json", "utf8"));
const exclusions = JSON.parse(readFileSync("registry/excluded-payloads.json", "utf8")).exclusions as Array<{
  id: string;
  category: string;
  payloadMovedTo: string;
}>;
const approvals = JSON.parse(readFileSync("registry/release-approvals.json", "utf8")).approvals as Array<{ skillId: string }>;

test("third-party review quarantine excludes exactly the 20 refused payloads", () => {
  assert.equal(exclusions.length, 20, "expected the 2026-10-29 review to quarantine exactly 20 payloads");
});

test("excluded payloads are absent from the registry and stay quarantined", () => {
  const registered = new Set(registry.skills.map((skill: { id: string }) => skill.id));
  for (const exclusion of exclusions) {
    assert.equal(false, registered.has(exclusion.id), `excluded payload must not be registered: ${exclusion.id}`);
    const quarantined = join("third-party-review", categorySlug(exclusion.category), exclusion.id);
    assert.equal(true, existsSync(join(quarantined, "SKILL.md")), `excluded payload must remain quarantined: ${exclusion.id}`);
    const shipped = join("skills", categorySlug(exclusion.category), exclusion.id);
    assert.equal(false, existsSync(shipped), `excluded payload must not ship under skills/: ${exclusion.id}`);
  }
});

test("approvals cover every registered skill and never an excluded one", () => {
  for (const approval of approvals) {
    assert.equal(false, exclusions.some((e) => e.id === approval.skillId), `approval must not exist for excluded skill: ${approval.skillId}`);
  }
  assert.equal(approvals.length, registry.skills.length, "every registered skill needs a complete approval record");
});
