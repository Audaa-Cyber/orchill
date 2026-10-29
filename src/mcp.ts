import { createInterface } from "node:readline";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "0.1.1";
const PROTOCOL = "2026-07-28";

type Json = Record<string, unknown>;
type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Json };

const tools = [
  {
    name: "orchill_list",
    title: "List Orchill catalogue",
    description: "List Orchill categories or skills. Same semantics as orchill list.",
    inputSchema: { type: "object", properties: {
      category: { type: "string", description: "Optional category name." },
      all: { type: "boolean", description: "List every skill when true." }
    }}
  },
  {
    name: "orchill_info",
    title: "Inspect Orchill content",
    description: "Inspect a skill or category. Same semantics as orchill info.",
    inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] }
  },
  {
    name: "orchill_add",
    title: "Install Orchill content",
    description: "Install a skill, category, or the full catalogue. Use confirm=false for a dry-run plan and confirm=true only after reviewing it.",
    inputSchema: { type: "object", properties: {
      name: { type: "string", description: "Skill id, skill name, category, or catalogue." },
      target: { type: "string", enum: ["project", "agents", "claude", "codex"] },
      cwd: { type: "string" },
      confirm: { type: "boolean", description: "Actually install. False performs a dry run." },
      force: { type: "boolean", description: "Replace an existing Orchill-managed installation." }
    }, required: ["name"] }
  },
  {
    name: "orchill_update",
    title: "Update Orchill installations",
    description: "Update Orchill-managed installed skills. Same semantics as orchill update.",
    inputSchema: { type: "object", properties: {
      target: { type: "string", enum: ["project", "agents", "claude", "codex"] },
      cwd: { type: "string" },
      confirm: { type: "boolean", description: "Actually update. False performs a plan only." }
    }}
  },
  {
    name: "orchill_remove",
    title: "Remove Orchill content",
    description: "Remove an Orchill-managed skill, category, or catalogue. Same semantics as orchill remove.",
    inputSchema: { type: "object", properties: {
      name: { type: "string" },
      target: { type: "string", enum: ["project", "agents", "claude", "codex"] },
      cwd: { type: "string" },
      confirm: { type: "boolean", description: "Actually remove. False performs a plan only." }
    }, required: ["name"] }
  },
  {
    name: "orchill_check",
    title: "Check Orchill installations",
    description: "Verify installed Orchill content. Same semantics as orchill check.",
    inputSchema: { type: "object", properties: {
      name: { type: "string", description: "Optional skill or category to check." },
      target: { type: "string", enum: ["project", "agents", "claude", "codex"] },
      cwd: { type: "string" }
    }}
  }
];

function reply(id: Rpc["id"], result: Json) {
  process.stdout.write(JSON.stringify({jsonrpc: "2.0", id, result}) + "\n");
}
function error(id: Rpc["id"], code: number, message: string) {
  process.stdout.write(JSON.stringify({jsonrpc: "2.0", id, error: {code, message}}) + "\n");
}
function runCli(args: string[]): string {
  const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), "cli.js");
  const result = spawnSync(process.execPath, [cli, ...args], {encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]});
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (result.status !== 0) throw new Error((stderr || stdout || "orchill command failed").trim());
  return (stdout + (stderr ? "\n" + stderr : "")).trim();
}
function textResult(text: string, isError = false): Json {
  return {resultType: "complete", content: [{type: "text", text}], ...(isError ? {isError: true} : {})};
}
function argsOf(params: Json | undefined): Json {
  const args = params?.arguments;
  return args && typeof args === "object" && !Array.isArray(args) ? args as Json : {};
}
function stringArg(args: Json, name: string): string | undefined {
  const value = args[name];
  return typeof value === "string" && value.length ? value : undefined;
}
function boolArg(args: Json, name: string): boolean {
  return typeof args[name] === "boolean" && args[name] === true;
}
function commandArgs(args: Json, base: string[]): string[] {
  const result = [...base];
  const target = stringArg(args, "target");
  const cwd = stringArg(args, "cwd");
  if (target) result.push("--target", target);
  if (cwd) result.push("--cwd", cwd);
  return result;
}

async function handle(request: Rpc) {
  if (request.id === undefined || request.id === null) return;
  const id = request.id;
  try {
    switch (request.method) {
      case "server/discover":
        return reply(id, {
          resultType: "complete",
          supportedVersions: [PROTOCOL],
          capabilities: {tools: {}},
          instructions: "Use Orchill through the same operations humans use: list, info, add, update, remove, and check. Review plans before write operations. orchill add catalogue installs the entire eligible catalogue with category and skill folders preserved.",
          ttlMs: 3600000,
          cacheScope: "public",
          _meta: {"io.modelcontextprotocol/serverInfo": {name: "orchill", version: VERSION}}
        });
      case "tools/list":
        return reply(id, {resultType: "complete", tools, ttlMs: 300000, cacheScope: "public"});
      case "tools/call": {
        const args = argsOf(request.params);
        const name = typeof request.params?.name === "string" ? request.params.name : "";
        let output = "";
        if (name === "orchill_list") {
          const cliArgs = ["list"];
          const category = stringArg(args, "category");
          if (category) cliArgs.push(category);
          if (boolArg(args, "all")) cliArgs.push("--all");
          output = runCli(cliArgs);
        } else if (name === "orchill_info") {
          output = runCli(["info", stringArg(args, "name") ?? ""]);
        } else if (name === "orchill_add") {
          const cliArgs = commandArgs(args, ["add", stringArg(args, "name") ?? ""]);
          if (boolArg(args, "force")) cliArgs.push("--force");
          cliArgs.push(boolArg(args, "confirm") ? "--yes" : "--dry-run");
          output = runCli(cliArgs);
        } else if (name === "orchill_update") {
          const cliArgs = commandArgs(args, ["update"]);
          cliArgs.push(boolArg(args, "confirm") ? "--yes" : "--dry-run");
          output = runCli(cliArgs);
        } else if (name === "orchill_remove") {
          const cliArgs = commandArgs(args, ["remove", stringArg(args, "name") ?? ""]);
          cliArgs.push("--yes");
          output = runCli(cliArgs);
        } else if (name === "orchill_check") {
          output = runCli(commandArgs(args, ["check"]));
        } else {
          return error(id, -32601, "Unknown tool: " + name);
        }
        return reply(id, textResult(output));
      }
      default:
        return error(id, -32601, "Method not found: " + (request.method ?? ""));
    }
  } catch (err) {
    return reply(id, textResult(err instanceof Error ? err.message : String(err), true));
  }
}

export async function runMcpServer(): Promise<void> {
  console.error("orchill MCP server listening on stdio");
  const rl = createInterface({input: process.stdin, crlfDelay: Infinity});
  for await (const line of rl) {
    if (!line.trim()) continue;
    let request: Rpc;
    try { request = JSON.parse(line) as Rpc; }
    catch { error(null, -32700, "Invalid JSON"); continue; }
    await handle(request);
  }
}
