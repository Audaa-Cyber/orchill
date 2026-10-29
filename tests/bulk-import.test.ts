import test from "node:test";
import assert from "node:assert/strict";
import {parseSkillCommand,slugify} from "../src/bulk-import.js";
test("parses source@skill shorthand",()=>assert.deepEqual(parseSkillCommand("npx skills add Leonxlnx/taste-skill@design-taste-frontend",1),{line:1,source:"Leonxlnx/taste-skill",skill:"design-taste-frontend",original:"npx skills add Leonxlnx/taste-skill@design-taste-frontend"}));
test("parses quoted explicit skill names",()=>assert.equal(parseSkillCommand('npx --yes skills add owner/repo --skill "Design Taste"',3).skill,"Design Taste"));
test("rejects arbitrary commands and unsafe URLs",()=>{assert.throws(()=>parseSkillCommand("rm -rf .",1),/npx skills add/);assert.throws(()=>parseSkillCommand("npx skills add https://user:pass@example.com/repo --skill test",1),/Source must be/);assert.throws(()=>parseSkillCommand("npx skills add owner/repo --skill test; whoami",1),/Unsupported option/);});
test("requires a skill name",()=>assert.throws(()=>parseSkillCommand("npx skills add owner/repo",1),/Specify one skill/));
test("slugifies safe IDs",()=>{assert.equal(slugify("Design Taste Frontend"),"design-taste-frontend");assert.throws(()=>slugify("***"),/Cannot create/);});
