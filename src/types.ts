export interface SkillSource {
  type: "local" | "git";
  path?: string;
  url?: string;
  ref?: string;
}
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  source: SkillSource;
  skillPath: string;
  license?: string;
  licenseEvidenceUrl?: string;
  provenance?: string;
  targets?: string[];
}
export interface Registry {
  version: 1;
  skills: Skill[];
}
