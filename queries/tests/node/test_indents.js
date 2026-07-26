/**
 * Test: indents.scm — 缩进规则查询验证 (Node.js)
 *
 * 验证 indents.scm 能正确捕获缩进节点。
 *
 * Usage:
 *     cd tree-sitter-cangjie
 *     node --test queries/tests/node/test_indents.js
 */

const { describe, test } = require("node:test");
const assert = require("node:assert");
const {
  getParser,
  getLanguage,
  loadQuery,
  runQueryCaptures,
} = require("./helpers");

describe("indents.scm", () => {
  const parser = getParser();
  const lang = getLanguage();
  const query = loadQuery(lang, "indents.scm");
  const captures = runQueryCaptures(lang, query, parser, "test_indents.cj");

  /** Get all node types captured as indent.begin. */
  function indentBeginTypes() {
    return new Set((captures["indent.begin"] || []).map((c) => c.type));
  }

  /** Get all text values captured as indent.end. */
  function indentEndTexts() {
    return new Set((captures["indent.end"] || []).map((c) => c.text));
  }

  test("class body triggers indentation", () => {
    assert.ok(indentBeginTypes().has("classBody"));
  });

  test("struct body triggers indentation", () => {
    assert.ok(indentBeginTypes().has("structBody"));
  });

  test("interface body triggers indentation", () => {
    assert.ok(indentBeginTypes().has("interfaceBody"));
  });

  test("enum body triggers indentation", () => {
    assert.ok(indentBeginTypes().has("enumBody"));
  });

  test("extend body triggers indentation", () => {
    assert.ok(indentBeginTypes().has("extendBody"));
  });

  test("function block triggers indentation", () => {
    assert.ok(indentBeginTypes().has("block"));
  });

  test("if expression triggers indentation", () => {
    assert.ok(indentBeginTypes().has("ifExpression"));
  });

  test("match expression triggers indentation", () => {
    assert.ok(indentBeginTypes().has("matchExpression"));
  });

  test("match case triggers indentation", () => {
    assert.ok(indentBeginTypes().has("matchCase"));
  });

  test("for expression triggers indentation", () => {
    assert.ok(indentBeginTypes().has("forInExpression"));
  });

  test("while expression triggers indentation", () => {
    assert.ok(indentBeginTypes().has("whileExpression"));
  });

  test("do-while expression triggers indentation", () => {
    assert.ok(indentBeginTypes().has("doWhileExpression"));
  });

  test("try expression triggers indentation", () => {
    assert.ok(indentBeginTypes().has("tryExpression"));
  });

  test("lambda expression triggers indentation", () => {
    assert.ok(indentBeginTypes().has("lambdaExpression"));
  });

  test("array literal triggers indentation", () => {
    assert.ok(indentBeginTypes().has("arrayLiteral"));
  });

  test("closing brackets trigger indent.end", () => {
    const texts = indentEndTexts();
    assert.ok(texts.has("}"));
    assert.ok(texts.has(")"));
    assert.ok(texts.has("]"));
  });

  test("comments trigger indent.auto", () => {
    const types = new Set(
      (captures["indent.auto"] || []).map((c) => c.type)
    );
    assert.ok(
      types.has("lineComment") || types.has("blockComment"),
      "Comments should trigger indent.auto"
    );
  });
});
