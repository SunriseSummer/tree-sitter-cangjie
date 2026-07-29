/**
 * Test: highlights.scm — 语法高亮查询验证 (Node.js)
 *
 * 验证 highlights.scm 能正确捕获各类语法元素。
 *
 * Usage:
 *     cd tree-sitter-cangjie
 *     npm run test:node
 */

const { describe, test } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const Parser = require("tree-sitter");
const {
  getParser,
  getLanguage,
  loadQuery,
  parseFile,
  runQueryCaptures,
  TESTCASE_DIR,
} = require("./helpers");

describe("highlights.scm", () => {
  const parser = getParser();
  const lang = getLanguage();
  const query = loadQuery(lang, "highlights.scm");
  const captures = runQueryCaptures(lang, query, parser, "test_highlights.cj");

  /** Get all capture names. */
  function captureNames() {
    return new Set(Object.keys(captures));
  }

  /** Get all text values for a capture name. */
  function textsFor(name) {
    return new Set((captures[name] || []).map((c) => c.text));
  }

  test("string literals are highlighted", () => {
    assert.ok(captureNames().has("string"));
  });

  test("number literals are highlighted", () => {
    assert.ok(captureNames().has("number"));
  });

  test("boolean literals use the builtin-constant capture", () => {
    const booleans = textsFor("constant.builtin");
    assert.ok(booleans.has("true"));
    assert.ok(booleans.has("false"));
    assert.ok(!textsFor("variable").has("true"));
    assert.ok(!textsFor("variable").has("false"));
  });

  test("comments are highlighted", () => {
    assert.ok(captureNames().has("comment"));
  });

  test("type names are highlighted", () => {
    const texts = textsFor("type");
    assert.ok(texts.has("Shape"));
    assert.ok(texts.has("Vector"));
    assert.ok(texts.has("Printable"));
    assert.ok(texts.has("Color"));
  });

  test("built-in type nodes exist in parse tree", () => {
    const cjPath = path.join(TESTCASE_DIR, "test_highlights.cj");
    const { tree } = parseFile(parser, cjPath);

    const typeNodes = new Set();
    function walk(node) {
      const builtins = [
        "Int8", "Int16", "Int32", "Int64",
        "UInt8", "UInt16", "UInt32", "UInt64",
        "Float16", "Float32", "Float64",
        "Rune", "Bool", "String",
      ];
      if (node.isNamed && builtins.includes(node.type)) {
        typeNodes.add(node.type);
      }
      for (let i = 0; i < node.childCount; i++) {
        walk(node.child(i));
      }
    }
    walk(tree.rootNode);

    assert.ok(typeNodes.has("Int64"));
    assert.ok(typeNodes.has("Float64"));
    assert.ok(typeNodes.has("Bool"));
    assert.ok(typeNodes.has("String"));
    assert.ok(typeNodes.has("Rune"));
  });

  test("function names are highlighted", () => {
    const texts = textsFor("function");
    assert.ok(texts.has("testOperators"));
    assert.ok(texts.has("createPoint"));
  });

  test("enum constructor names are highlighted", () => {
    const texts = textsFor("constructor");
    assert.ok(texts.has("Red"));
    assert.ok(texts.has("Green"));
    assert.ok(texts.has("Blue"));
  });

  test("keywords are highlighted", () => {
    const allTexts = new Set();
    for (const name of captureNames()) {
      if (name.startsWith("keyword")) {
        for (const t of textsFor(name)) allTexts.add(t);
      }
    }
    for (const kw of [
      "class", "func", "if", "else", "for", "while", "match",
      "try", "catch", "return", "struct", "enum", "interface",
      "extend", "type", "do", "break", "continue", "finally",
      "throw", "let", "var", "case",
    ]) {
      assert.ok(allTexts.has(kw), `Keyword '${kw}' not highlighted`);
    }
  });

  test("operators are highlighted", () => {
    const texts = textsFor("operator");
    for (const op of [
      "+", "-", "*", "/", "==", "!=", "&&", "||", "%", "**",
      "<", ">", "<=", ">=", "&", "|", "^", "<<", ">>",
      "+=", "-=", "*=", "/=", "=", "..", "..=",
    ]) {
      assert.ok(texts.has(op), `Operator '${op}' not highlighted`);
    }
  });

  test("punctuation delimiters are highlighted", () => {
    const texts = textsFor("punctuation.delimiter");
    assert.ok(texts.has("."));
    assert.ok(texts.has(","));
    assert.ok(texts.has(":"));
  });

  test("brackets are highlighted", () => {
    const texts = textsFor("punctuation.bracket");
    for (const b of ["(", ")", "{", "}", "[", "]"]) {
      assert.ok(texts.has(b), `Bracket '${b}' not highlighted`);
    }
  });

  test("modifiers are highlighted", () => {
    const allTexts = new Set();
    for (const item of captures["keyword.modifier"] || []) {
      for (const word of item.text.split(/\s+/)) {
        allTexts.add(word);
      }
    }
    for (const mod of ["public", "open", "abstract", "protected"]) {
      assert.ok(allTexts.has(mod), `Modifier '${mod}' not highlighted`);
    }
  });

  test("variables are highlighted", () => {
    assert.ok(captureNames().has("variable"));
  });

  test("property names are highlighted", () => {
    const texts = textsFor("property");
    assert.ok(texts.has("perimeter"));
  });

  test("character literals are highlighted", () => {
    assert.ok(captureNames().has("character"));
  });
});
