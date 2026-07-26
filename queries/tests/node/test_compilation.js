/**
 * Test: SCM 查询编译验证 (Node.js)
 *
 * 验证所有 .scm 查询文件能正确编译。
 *
 * Usage:
 *     cd tree-sitter-cangjie
 *     node --test queries/tests/node/test_compilation.js
 */

const { describe, test } = require("node:test");
const assert = require("node:assert");
const { getLanguage, loadQuery } = require("./helpers");

describe("SCM Query Compilation", () => {
  const lang = getLanguage();

  test("highlights.scm compiles without errors", () => {
    const q = loadQuery(lang, "highlights.scm");
    assert.ok(q);
  });

  test("indents.scm compiles without errors", () => {
    const q = loadQuery(lang, "indents.scm");
    assert.ok(q);
  });

  test("locals.scm compiles without errors", () => {
    const q = loadQuery(lang, "locals.scm");
    assert.ok(q);
  });

  test("tags.scm compiles without errors", () => {
    const q = loadQuery(lang, "tags.scm");
    assert.ok(q);
  });

  test("textobjects.scm compiles without errors", () => {
    const q = loadQuery(lang, "textobjects.scm");
    assert.ok(q);
  });
});
