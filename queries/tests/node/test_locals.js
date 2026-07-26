/**
 * Test: locals.scm — 作用域/定义/引用查询验证 (Node.js)
 *
 * 验证 locals.scm 能正确捕获作用域边界、变量定义和引用。
 *
 * Usage:
 *     cd tree-sitter-cangjie
 *     node --test queries/tests/node/test_locals.js
 */

const { describe, test } = require("node:test");
const assert = require("node:assert");
const {
  getParser,
  getLanguage,
  loadQuery,
  runQueryCaptures,
} = require("./helpers");

describe("locals.scm — Scopes", () => {
  const parser = getParser();
  const lang = getLanguage();
  const query = loadQuery(lang, "locals.scm");
  const captures = runQueryCaptures(lang, query, parser, "test_locals.cj");

  function scopeTypes() {
    return new Set((captures["local.scope"] || []).map((c) => c.type));
  }

  test("translationUnit scope", () => {
    assert.ok(scopeTypes().has("translationUnit"));
  });

  test("classDefinition scope", () => {
    assert.ok(scopeTypes().has("classDefinition"));
  });

  test("structDefinition scope", () => {
    assert.ok(scopeTypes().has("structDefinition"));
  });

  test("interfaceDefinition scope", () => {
    assert.ok(scopeTypes().has("interfaceDefinition"));
  });

  test("enumDefinition scope", () => {
    assert.ok(scopeTypes().has("enumDefinition"));
  });

  test("extendDefinition scope", () => {
    assert.ok(scopeTypes().has("extendDefinition"));
  });

  test("functionDefinition scope", () => {
    assert.ok(scopeTypes().has("functionDefinition"));
  });

  test("mainDefinition scope", () => {
    assert.ok(scopeTypes().has("mainDefinition"));
  });

  test("block scope", () => {
    assert.ok(scopeTypes().has("block"));
  });

  test("forInExpression scope", () => {
    assert.ok(scopeTypes().has("forInExpression"));
  });

  test("whileExpression scope", () => {
    assert.ok(scopeTypes().has("whileExpression"));
  });

  test("matchCase scope", () => {
    assert.ok(scopeTypes().has("matchCase"));
  });

  test("tryExpression scope", () => {
    assert.ok(scopeTypes().has("tryExpression"));
  });

  test("ifExpression scope", () => {
    assert.ok(scopeTypes().has("ifExpression"));
  });

  test("lambdaExpression scope", () => {
    assert.ok(scopeTypes().has("lambdaExpression"));
  });

  test("init scope", () => {
    assert.ok(scopeTypes().has("init"));
  });

  test("propertyDefinition scope", () => {
    assert.ok(scopeTypes().has("propertyDefinition"));
  });
});

describe("locals.scm — Definitions", () => {
  const parser = getParser();
  const lang = getLanguage();
  const query = loadQuery(lang, "locals.scm");
  const captures = runQueryCaptures(lang, query, parser, "test_locals.cj");

  function definitionTexts() {
    return new Set((captures["local.definition"] || []).map((c) => c.text));
  }

  test("class name captured", () => {
    assert.ok(definitionTexts().has("MyClass"));
  });

  test("struct name captured", () => {
    assert.ok(definitionTexts().has("MyStruct"));
  });

  test("interface name captured", () => {
    assert.ok(definitionTexts().has("MyInterface"));
  });

  test("enum name captured", () => {
    assert.ok(definitionTexts().has("MyEnum"));
  });

  test("type alias name captured", () => {
    assert.ok(definitionTexts().has("MyAlias"));
  });

  test("function name captured", () => {
    assert.ok(definitionTexts().has("myFunc"));
  });

  test("property name captured", () => {
    assert.ok(definitionTexts().has("data"));
  });

  test("variable declarations captured", () => {
    const defs = definitionTexts();
    assert.ok(defs.has("x"));
    assert.ok(defs.has("y"));
  });

  test("tuple destructuring captured", () => {
    const defs = definitionTexts();
    assert.ok(defs.has("a"));
    assert.ok(defs.has("b"));
  });

  test("function parameter captured", () => {
    assert.ok(definitionTexts().has("param"));
  });

  test("named parameter captured", () => {
    assert.ok(definitionTexts().has("named"));
  });

  test("lambda parameter captured", () => {
    const defs = definitionTexts();
    assert.ok(defs.has("a"));
    assert.ok(defs.has("b"));
  });

  test("for-in variable captured", () => {
    assert.ok(definitionTexts().has("i"));
  });

  test("for-in tuple bindings captured", () => {
    const defs = definitionTexts();
    assert.ok(defs.has("tupleRow"));
    assert.ok(defs.has("tupleColumn"));
  });

  test("nested enum payload bindings captured", () => {
    const defs = definitionTexts();
    for (const name of [
      "ifLeft", "ifRight", "whileLeft", "whileRight",
      "matchLeft", "matchRight",
    ]) {
      assert.ok(defs.has(name), `Missing pattern binding '${name}'`);
    }
    assert.ok(!defs.has("Some"), "Enum constructor must not be a local definition");
  });

  test("match case binding captured", () => {
    assert.ok(definitionTexts().has("v"));
  });

  test("catch variable captured", () => {
    assert.ok(definitionTexts().has("e"));
  });

  test("generic type parameter captured", () => {
    assert.ok(definitionTexts().has("T"));
  });

  test("definition capture multiset has no unexpected names or duplicates", () => {
    const actual = (captures["local.definition"] || []).map((capture) => capture.text).sort();
    const expected = [
      "MyClass", "name", "name", "speak", "displayName", "MyStruct", "MyStruct",
      "x", "y", "MyInterface", "doSomething", "MyEnum", "MyAlias", "myFunc",
      "param", "named", "x", "y", "a", "b", "identity", "T", "value",
      "Container", "_data", "data", "doSomething", "add", "a", "b", "i",
      "pairOption", "tupleRow", "tupleColumn", "ifLeft", "ifRight", "whileLeft",
      "whileRight", "matchLeft", "matchRight", "count", "v", "e", "val",
      "double", "n", "i", "inner", "n",
    ].sort();
    assert.deepEqual(actual, expected);
  });
});

describe("locals.scm — References", () => {
  const parser = getParser();
  const lang = getLanguage();
  const query = loadQuery(lang, "locals.scm");
  const captures = runQueryCaptures(lang, query, parser, "test_locals.cj");

  function referenceTexts() {
    return new Set((captures["local.reference"] || []).map((c) => c.text));
  }

  test("variable references captured", () => {
    const refs = referenceTexts();
    assert.ok(refs.has("param"));
    assert.ok(refs.has("x"));
  });

  test("function call reference captured", () => {
    assert.ok(referenceTexts().has("println"));
  });

  test("type references captured", () => {
    assert.ok(referenceTexts().has("Exception"));
  });
});
