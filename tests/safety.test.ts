import test from "node:test";
import assert from "node:assert/strict";
import { safeRelativePath } from "../src/safety.js";

test("accepts simple relative paths", () => {
  assert.equal(safeRelativePath("skills/my-skill", "path"), "skills/my-skill");
  assert.equal(safeRelativePath(".", "path"), ".");
});
test("rejects absolute paths", () => {
  assert.throws(() => safeRelativePath("/tmp/skill", "path"), /relative/);
});
test("rejects traversal paths", () => {
  assert.throws(() => safeRelativePath("../outside", "path"), /escape/);
  assert.throws(() => safeRelativePath("skills/../../outside", "path"), /escape/);
});
test("rejects NUL bytes", () => {
  assert.throws(() => safeRelativePath("skill\0name", "path"), /relative/);
});

test("rejects Windows absolute paths and cross-platform traversal", () => {
  assert.throws(() => safeRelativePath("C:\\outside\\skill", "path"), /relative/);
  assert.throws(() => safeRelativePath("\\\\server\\share\\skill", "path"), /relative/);
  assert.throws(() => safeRelativePath("skills\\..\\..\\outside", "path"), /escape/);
});
