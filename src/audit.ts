import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Registry, Skill } from "./types.js";

export type AuditSeverity = "error" | "warning" | "review";

export interface AuditFinding {
  skillId: string;
  severity: AuditSeverity;
  code: string;
  message: string;
  file?: string;
  line?: number;
}

const TEXT_EXTENSIONS = new Set([
  ".md", ".markdown", ".txt", ".sh", ".bash", ".zsh", ".js", ".cjs", ".mjs",
  ".ts", ".tsx", ".jsx", ".py", ".ps1", ".bat", ".cmd", ".json", ".yaml",
  ".yml", ".toml", ".xml", ".html", ".css"
]);
const MAX_SCANNED_FILE_BYTES = 1024 * 1024;

const REVIEW_PATTERNS: Array<{ code: string; message: string; pattern: RegExp }> = [
  { code: "PROMPT_OVERRIDE_LANGUAGE", message: "Instruction attempts to override prior or higher-priority instructions; review in context.", pattern: /ignore\s+(all\s+)?(previous|prior|above|system)\s+instructions|disregard\s+(all\s+)?(previous|prior|system)\s+instructions/i },
  { code: "SECRET_ACCESS", message: "References environment secrets or credential stores; confirm the use is necessary and safe.", pattern: /process\.env|os\.environ|\.aws\/credentials|\.ssh\/id_rsa|GITHUB_TOKEN|OPENAI_API_KEY/i },
  { code: "SHELL_EXECUTION", message: "Contains shell/process execution; inspect the exact command and its inputs.", pattern: /child_process|execSync\s*\(|spawnSync\s*\(|subprocess\.(run|Popen|call)\s*\(|\beval\s*\(/i },
  { code: "REMOTE_SCRIPT_PIPE", message: "Downloads or pipes remote content into a shell; high-risk pattern requires manual review.", pattern: /(?:curl|wget)[^\n|]{0,240}\|\s*(?:sh|bash|zsh)|(?:sh|bash)\s+-c\s+.*(?:curl|wget)/i },
  { code: "DESTRUCTIVE_COMMAND", message: "Contains a potentially destructive filesystem command; review exact scope and safeguards.", pattern: /rm\s+-rf\s+(?:\/|~|\$HOME)|Remove-Item[^\n]{0,100}-Recurse[^\n]{0,100}-Force/i }
];

function addFinding(findings: AuditFinding[], skillId: string, severity: AuditSeverity, code: string, message: string, file?: string, line?: number): void {
  findings.push({ skillId, severity, code, message, ...(file ? { file } : {}), ...(line ? { line } : {}) });
}

async function scanLocalSkill(skill: Skill, registryRoot: string, findings: AuditFinding[]): Promise<void> {
  const sourceRoot = path.resolve(registryRoot, skill.source.path!);
  const skillRoot = skill.skillPath === "." ? sourceRoot : path.resolve(sourceRoot, skill.skillPath);
  const relative = path.relative(sourceRoot, skillRoot);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    addFinding(findings, skill.id, "error", "SKILL_PATH_ESCAPE", "Configured skillPath escapes its local source directory.");
    return;
  }

  try {
    const rootInfo = await lstat(skillRoot);
    if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
      addFinding(findings, skill.id, "error", "SKILL_PATH_NOT_DIRECTORY", "Configured local skill path is not a regular directory.", skillRoot);
      return;
    }
  } catch {
    addFinding(findings, skill.id, "error", "SKILL_PATH_MISSING", "Configured local skill directory does not exist.", skillRoot);
    return;
  }

  const skillMarkdown = path.join(skillRoot, "SKILL.md");
  try {
    const info = await lstat(skillMarkdown);
    if (!info.isFile() || info.isSymbolicLink()) {
      addFinding(findings, skill.id, "error", "SKILL_MD_NOT_REGULAR_FILE", "SKILL.md must be a regular file.", skillMarkdown);
    }
  } catch {
    addFinding(findings, skill.id, "error", "SKILL_MD_MISSING", "No SKILL.md exists at the configured skill root.", skillMarkdown);
  }

  async function walk(directory: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      addFinding(findings, skill.id, "error", "DIRECTORY_UNREADABLE", "Could not read a local skill directory.", directory);
      return;
    }
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const fullPath = path.join(directory, entry.name);
      let info;
      try {
        info = await lstat(fullPath);
      } catch {
        addFinding(findings, skill.id, "error", "FILE_UNREADABLE", "Could not inspect a local skill path.", fullPath);
        continue;
      }
      if (info.isSymbolicLink()) {
        addFinding(findings, skill.id, "error", "SYMLINK_IN_SOURCE", "Symbolic links are not copied by Orchill and need manual review.", fullPath);
        continue;
      }
      if (info.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!info.isFile() || !TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      if (info.size > MAX_SCANNED_FILE_BYTES) {
        addFinding(findings, skill.id, "review", "FILE_TOO_LARGE_TO_SCAN", "Skipped text scan because this file exceeds 1 MiB.", fullPath);
        continue;
      }
      let contents: string;
      try {
        contents = await readFile(fullPath, "utf8");
      } catch {
        addFinding(findings, skill.id, "review", "TEXT_SCAN_FAILED", "Could not read this text-like file for heuristic review.", fullPath);
        continue;
      }
      const lines = contents.split(/\r?\n/);
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index]!;
        for (const rule of REVIEW_PATTERNS) {
          if (rule.pattern.test(line)) {
            addFinding(findings, skill.id, "review", rule.code, rule.message, fullPath, index + 1);
          }
        }
      }
    }
  }

  await walk(skillRoot);
}

export async function auditRegistry(registry: Registry, registryRoot: string): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  for (const skill of registry.skills) {
    if (!skill.license?.trim()) {
      addFinding(findings, skill.id, "warning", "LICENSE_UNKNOWN", "No license is recorded; do not assume redistribution is permitted.");
    }
    if (!skill.provenance?.trim()) {
      addFinding(findings, skill.id, "warning", "PROVENANCE_MISSING", "No provenance or review note is recorded.");
    }
    if (skill.source.type === "git") {
      if (!skill.source.ref?.trim()) {
        addFinding(findings, skill.id, "warning", "SOURCE_UNPINNED", "Git source has no ref pinned; installs may change over time.");
      }
      addFinding(findings, skill.id, "review", "REMOTE_SOURCE_NOT_SCANNED", "Remote source content was not downloaded or scanned by this audit.");
    } else {
      await scanLocalSkill(skill, registryRoot, findings);
    }
  }
  return findings.sort((a, b) =>
    ({ error: 0, warning: 1, review: 2 }[a.severity] - { error: 0, warning: 1, review: 2 }[b.severity]) ||
    a.skillId.localeCompare(b.skillId) || a.code.localeCompare(b.code) ||
    (a.line ?? 0) - (b.line ?? 0)
  );
}

export function auditSummary(findings: AuditFinding[], totalSkills: number) {
  return {
    totalSkills,
    totalFindings: findings.length,
    errors: findings.filter(f => f.severity === "error").length,
    warnings: findings.filter(f => f.severity === "warning").length,
    reviewItems: findings.filter(f => f.severity === "review").length
  };
}
