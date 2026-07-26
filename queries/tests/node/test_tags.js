const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const {
  getParser,
  getLanguage,
  loadQuery,
  runQueryMatches,
} = require("./helpers");

describe("tags.scm", () => {
  const parser = getParser();
  const lang = getLanguage();
  const query = loadQuery(lang, "tags.scm");
  const matches = runQueryMatches(lang, query, parser, "test_tags.cj");

  function matchesFor(role) {
    return matches.filter((match) =>
      match.captures.some((capture) => capture.name === role)
    );
  }

  function namesFor(role) {
    return new Set(matchesFor(role).map((match) => {
      const names = match.captures.filter((capture) => capture.name === "name");
      assert.equal(names.length, 1, `${role} match must contain exactly one @name`);
      return names[0].text;
    }));
  }

  function assertRoleNodeTypes(role, expectedTypes) {
    const allowed = new Set(expectedTypes);
    for (const match of matchesFor(role)) {
      const roles = match.captures.filter((capture) => capture.name === role);
      assert.equal(roles.length, 1, `${role} match must contain one role capture`);
      assert.ok(
        allowed.has(roles[0].type),
        `${role} must capture an outer definition node, got ${roles[0].type}`
      );
    }
  }

  test("every tag match pairs an outer definition with one @name", () => {
    for (const match of matches) {
      const roles = match.captures.filter((capture) =>
        capture.name.startsWith("definition.") || capture.name.startsWith("reference.")
      );
      const names = match.captures.filter((capture) => capture.name === "name");
      assert.equal(roles.length, 1);
      assert.equal(names.length, 1);
      const sameNode = roles[0].type === names[0].type &&
        JSON.stringify([roles[0].startPosition, roles[0].endPosition]) ===
          JSON.stringify([names[0].startPosition, names[0].endPosition]);
      assert.equal(
        sameNode,
        false,
        "the role capture must not be the name node (the legacy false-green shape)"
      );
    }
  });

  test("type definitions use protocol-compliant names and outer nodes", () => {
    assert.deepEqual(namesFor("definition.class"), new Set(["MyClass", "WithProperty", "Calculator"]));
    assert.deepEqual(namesFor("definition.struct"), new Set(["MyStruct"]));
    assert.deepEqual(namesFor("definition.interface"), new Set(["MyInterface"]));
    assert.deepEqual(namesFor("definition.enum"), new Set(["MyEnum"]));
    assertRoleNodeTypes("definition.class", ["classDefinition"]);
    assertRoleNodeTypes("definition.struct", ["structDefinition"]);
    assertRoleNodeTypes("definition.interface", ["interfaceDefinition"]);
    assertRoleNodeTypes("definition.enum", ["enumDefinition"]);
  });

  test("functions, main, init and operators tag their outer definitions", () => {
    const names = namesFor("definition.function");
    for (const expected of ["myFunction", "genericFunc", "classMethod", "main", "init", "=="]) {
      assert.ok(names.has(expected), `missing function tag ${expected}`);
    }
    assertRoleNodeTypes("definition.function", [
      "functionDefinition",
      "operatorFunctionDefinition",
      "mainDefinition",
      "init",
    ]);
  });

  test("enum constructors, aliases and properties use @name", () => {
    assert.deepEqual(namesFor("definition.constant"), new Set(["Value1", "Value2"]));
    assert.ok(namesFor("definition.type").has("MyTypeAlias"));
    assert.ok(namesFor("definition.property").has("value"));
    assertRoleNodeTypes("definition.constant", ["enumConstructor"]);
    assertRoleNodeTypes("definition.type", ["typeAlias"]);
    assertRoleNodeTypes("definition.property", ["propertyDefinition"]);
  });
});
