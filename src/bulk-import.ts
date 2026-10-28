import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

export interface SkillCommand { line: number; source: string; skill: string; original: string; }
export interface ImportRecord { line: number; command: string; status: "imported" | "failed" | "preview"; id?: string; error?: string; licenseFound?: boolean; }

function tokenize(text: string): string[] {
  const out: string[] = []; let word = ""; let quote = ""; let escape = false;
  for (const ch of text.trim()) {
    if (escape) { word += ch; escape = false; continue; }
    if (ch === "\\" && quote !== "'") { escape = true; continue; }
    if (quote) { if (ch === quote) quote = ""; else word += ch; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (/\s/.test(ch)) { if (word) { out.push(word); word = ""; } } else word += ch;
  }
  if (escape || quote) throw new Error("Unclosed quote or escape.");
  if (word) out.push(word);
  return out;
}
function validSource(value: string): boolean {
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(value)) return true;
  if (/[;&|<>$(){}!\r\n]/.test(value) || value.includes(String.fromCharCode(96))) return false;
  try { const u = new URL(value); return u.protocol === "https:" && !!u.hostname && !u.username && !u.password && !u.search && !u.hash && /^[a-zA-Z0-9._~/-]*$/.test(u.pathname); } catch { return false; }
}
export function parseSkillCommand(text: string, line: number): SkillCommand {
  const t = tokenize(text); let i = 1;
  if (t[0] !== "npx") throw new Error("Expected npx skills add.");
  if (t[i] === "--yes" || t[i] === "-y") i++;
  if (t[i] !== "skills" || t[i + 1] !== "add") throw new Error("Only npx skills add commands are accepted; shell commands are never executed.");
  i += 2; const raw = t[i++]; if (!raw || raw.startsWith("-")) throw new Error("Missing source.");
  let source = raw; let skill = ""; const at = raw.lastIndexOf("@");
  if (at > 0 && validSource(raw.slice(0, at)) && /^[a-zA-Z0-9][a-zA-Z0-9._ -]*$/.test(raw.slice(at + 1))) { source = raw.slice(0, at); skill = raw.slice(at + 1); }
  while (i < t.length) {
    const arg = t[i++];
    if (arg === "--skill" || arg === "-s") { const val = t[i++]; if (!val) throw new Error("Missing --skill value."); if (skill && skill !== val) throw new Error("Conflicting skill names."); skill = val; }
    else if (arg !== "--yes" && arg !== "-y" && arg !== "--copy") throw new Error("Unsupported option or argument: " + arg);
  }
  if (!validSource(source)) throw new Error("Source must be owner/repo shorthand or a safe HTTPS URL.");
  if (!skill || !/^[a-zA-Z0-9][a-zA-Z0-9._ -]*$/.test(skill)) throw new Error("Specify one skill with source@skill or --skill <name>.");
  return {line, source, skill, original: text.trim()};
}
export function slugify(value: string): string {
  const id = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!id) throw new Error("Cannot create a safe ID from skill name: " + value);
  return id;
}
function frontmatter(markdown: string): Record<string, string> {
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/); const out: Record<string,string> = {};
  if (!m) return out;
  const body = m[1]; if (body === undefined) return out;\n  for (const line of body.split(/\r?\n/)) { const p = line.match(/^([a-zA-Z][\w-]*):\s*(.*?)\s*$/); if (p && p[1] !== undefined && p[2] !== undefined) out[p[1].toLowerCase()] = p[2].replace(/^(['"])(.*)\1$/, "$2"); }
  return out;
}
function invokeSkills(source: string, skill: string, cwd: string): Promise<void> {
  const exe = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = ["--yes", "skills", "add", source, "--skill", skill, "--agent", "codex", "--copy", "--yes"];
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, {cwd, stdio: "inherit", shell: process.platform === "win32", windowsHide: true});
    child.once("error", reject); child.once("close", code => code === 0 ? resolve() : reject(new Error("Skills CLI exited with code " + code)));
  });
}
async function findSkill(cwd: string): Promise<string> {
  const root = path.join(cwd, ".agents", "skills"); const entries = await readdir(root, {withFileTypes:true}).catch(() => []);
  const found: string[] = [];
  for (const e of entries) if (e.isDirectory() && !e.name.startsWith(".")) {
    const dir = path.join(root, e.name);
    try { const s = await lstat(path.join(dir, "SKILL.md")); if (s.isFile() && !s.isSymbolicLink()) found.push(dir); } catch {}
  }
  if (found.length !== 1) throw new Error("Expected exactly one staged skill folder; found " + found.length);
  return found[0]!;
}
async function noSymlinks(dir: string): Promise<void> {
  for (const e of await readdir(dir, {withFileTypes:true})) { const p = path.join(dir,e.name); const s = await lstat(p); if (s.isSymbolicLink()) throw new Error("Skill contains a symlink: " + p); if (s.isDirectory()) await noSymlinks(p); }
}
export async function runBulkImport(inputFile: string, outputPath: string, category: string, dryRun = false): Promise<ImportRecord[]> {
  const input = path.resolve(inputFile), output = path.resolve(outputPath);
  const lines = (await readFile(input,"utf8")).split(/\r?\n/).map((s,i)=>({s:s.trim(),line:i+1})).filter(x=>x.s && !x.s.startsWith("#"));
  if (!lines.length) throw new Error("No commands found in " + input);
  const parsed: Array<{cmd: SkillCommand; error?: string}> = lines.map(x => { try { return {cmd:parseSkillCommand(x.s,x.line)}; } catch(e) { return {cmd:{line:x.line,source:"",skill:"",original:x.s},error:e instanceof Error?e.message:String(e)}; } });
  if (dryRun) {
    for (const p of parsed) console.log((p.error ? "FAIL " + p.error : "OK " + p.cmd.source + " -> " + p.cmd.skill) + " (line " + p.cmd.line + ")");
    return parsed.map(p=>({line:p.cmd.line,command:p.cmd.original,status:p.error?"failed":"preview",...(p.error?{error:p.error}:{})}));
  }
  try { await lstat(output); throw new Error("Output already exists; choose a new directory: " + output); } catch(e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
  await mkdir(path.join(output,"skills"),{recursive:true});
  const records: ImportRecord[] = [], entries: Record<string,unknown>[] = [], seen = new Set<string>();
  for (const p of parsed) {
    const c = p.cmd;
    if (p.error) { records.push({line:c.line,command:c.original,status:"failed",error:p.error}); console.error("FAIL line " + c.line + ": " + p.error); continue; }
    let temp = "";
    try {
      temp = await mkdtemp(path.join(os.tmpdir(),"orchill-import-")); const work=path.join(temp,"work"); await mkdir(work,{recursive:true});
      console.log("Importing line " + c.line + ": " + c.source + " skill " + c.skill);
      await invokeSkills(c.source,c.skill,work);
      const dir=await findSkill(work); await noSymlinks(dir);
      const md=await readFile(path.join(dir,"SKILL.md"),"utf8"), fm=frontmatter(md);
      const name=fm.name?.trim() || c.skill, id=slugify(name);
      if (seen.has(id)) throw new Error("Duplicate generated skill ID: " + id); seen.add(id);
      const dest=path.join(output,"skills",id); await cp(dir,dest,{recursive:true,errorOnExist:true,force:false});
      const licenseFound=(await readdir(dest)).some(n=>/^(license|licence)(\.|$)/i.test(n));
      const entry:Record<string,unknown>={id,name,description:fm.description?.trim() || "Description requires review; imported from " + c.source + ".",category,source:{type:"local",path:"./skills/"+id},skillPath:".",provenance:"Imported with Skills CLI from "+c.source+"; command: "+c.original+". Verify source, pin, and license before publishing.",targets:["project","claude","codex","agents"]};
      if(fm.license) entry.license=fm.license; entries.push(entry);
      records.push({line:c.line,command:c.original,status:"imported",id,licenseFound});
      console.log("STAGED " + id + (licenseFound ? " (license file present; verify terms)" : " (no root license file found)"));
    } catch(e) { records.push({line:c.line,command:c.original,status:"failed",error:e instanceof Error?e.message:String(e)}); console.error("FAIL line "+c.line+": "+(e instanceof Error?e.message:String(e))); }
    finally { if(temp) await rm(temp,{recursive:true,force:true}).catch(()=>undefined); }
  }
  await writeFile(path.join(output,"registry-additions.json"),JSON.stringify({version:1,skills:entries},null,2)+"\n",{flag:"wx"});
  await writeFile(path.join(output,"report.json"),JSON.stringify({total:records.length,imported:records.filter(x=>x.status==="imported").length,failed:records.filter(x=>x.status==="failed").length,records},null,2)+"\n",{flag:"wx"});
  const report=["# Orchill bulk import report","","Commands: "+records.length,"Staged: "+records.filter(x=>x.status==="imported").length,"Failed: "+records.filter(x=>x.status==="failed").length,"","## Results","",...records.map(x=>"- "+x.status.toUpperCase()+" line "+x.line+": "+(x.id||x.command)+(x.error?" — "+x.error:"")+(x.licenseFound===false?" — verify license before publishing":"")),"","Review every skill's instructions, scripts, provenance, metadata, and license. A license file's presence is not proof of permission to redistribute. The main registry is not modified automatically.",""];
  await writeFile(path.join(output,"report.md"),report.join("\n"),{flag:"wx"});
  console.log("Import complete. Review report.md and registry-additions.json in " + output + ". Main registry unchanged.");
  if(records.some(x=>x.status==="failed")) process.exitCode=1;
  return records;
}
