import test from "node:test";
import assert from "node:assert/strict";
import { parseMarketplaceCommand, parseMarketplaceCommands } from "../src/marketplace-import.js";

test("parses marketplace registration commands", () => {
  assert.deepEqual(parseMarketplaceCommand("/plugin marketplace add dotnet/skills", 1), {
    kind: "marketplace", line: 1, repo: "dotnet/skills", original: "/plugin marketplace add dotnet/skills"
  });
});

test("parses plugin installs with marketplace aliases", () => {
  assert.deepEqual(parseMarketplaceCommand("/plugin install dotnet-diag@dotnet-agent-skills", 4), {
    kind: "plugin", line: 4, plugin: "dotnet-diag", marketplace: "dotnet-agent-skills",
    original: "/plugin install dotnet-diag@dotnet-agent-skills"
  });
});

test("rejects shell-like and unsupported marketplace syntax", () => {
  assert.throws(() => parseMarketplaceCommand("/plugin marketplace add https://user:pass@example.com/x", 1), /owner\/repo/);
  assert.throws(() => parseMarketplaceCommand("/plugin install dotnet-diag@market; whoami", 2), /Expected/);
  assert.throws(() => parseMarketplaceCommand("git clone https://github.com/dotnet/skills", 3), /Expected/);
});

test("parses command files while ignoring comments and blank lines", () => {
  const parsed = parseMarketplaceCommands("# marketplace\n\n/plugin marketplace add dotnet/skills\n/plugin install dotnet-diag@dotnet-agent-skills");
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0]?.command.line, 3);
  assert.equal(parsed[1]?.command.kind, "plugin");
});
