/**
 * Test: textobjects.scm — 文本对象查询验证 (Node.js)
 *
 * 验证 textobjects.scm 能正确捕获文本对象。
 *
 * Usage:
 *     cd tree-sitter-cangjie
 *     node --test queries/tests/node/test_textobjects.js
 */

const { describe, test } = require("node:test");
const assert = require("node:assert");
const {
  getParser,
  getLanguage,
  loadQuery,
  runQueryCaptures,
} = require("./helpers");

describe("textobjects.scm", () => {
  const parser = getParser();
  const lang = getLanguage();
  const query = loadQuery(lang, "textobjects.scm");
  const captures = runQueryCaptures(
    lang, query, parser, "test_textobjects.cj"
  );

  function captureNames() {
    return new Set(Object.keys(captures));
  }

  test("class.inside present", () => {
    assert.ok(captureNames().has("class.inside"));
  });

  test("class.around present", () => {
    assert.ok(captureNames().has("class.around"));
  });

  test("function.inside present", () => {
    assert.ok(captureNames().has("function.inside"));
  });

  test("function.around present", () => {
    assert.ok(captureNames().has("function.around"));
  });

  test("loop.inside present", () => {
    assert.ok(captureNames().has("loop.inside"));
  });

  test("loop.around present", () => {
    assert.ok(captureNames().has("loop.around"));
  });

  test("conditional.inside present", () => {
    assert.ok(captureNames().has("conditional.inside"));
  });

  test("conditional.around present", () => {
    assert.ok(captureNames().has("conditional.around"));
  });

  test("comment.inside present", () => {
    assert.ok(captureNames().has("comment.inside"));
  });

  test("comment.around present", () => {
    assert.ok(captureNames().has("comment.around"));
  });

  test("parameter.inside present", () => {
    assert.ok(captureNames().has("parameter.inside"));
  });

  test("parameter.around present", () => {
    assert.ok(captureNames().has("parameter.around"));
  });
});
