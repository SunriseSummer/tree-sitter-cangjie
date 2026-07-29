/**
 * Test suite for tree-sitter-cangjie grammar (Node.js).
 *
 * This script loads the tree-sitter-cangjie parser and tests it against
 * all .cj files under the tests/fixtures/projects/ directory.
 *
 * For each .cj file there is a corresponding .ast file in the same directory
 * containing the expected S-expression of the parse tree. The test parses
 * the .cj file and compares the actual output against the .ast snapshot.
 *
 * Usage:
 *     npm run test:node
 */

const { describe, test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const Parser = require("tree-sitter");
const Cangjie = require("../../bindings/node");

const TESTCASE_DIR = path.resolve(
  __dirname,
  "..",
  "fixtures",
  "projects"
);

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Find all .cj files recursively under a directory.
 */
function findCjFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findCjFiles(fullPath));
    } else if (entry.name.endsWith(".cj")) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

/**
 * Reject recovery nodes independently of snapshot equality. A snapshot can
 * accidentally record an ERROR or MISSING node and would otherwise make the
 * malformed parse look like a passing regression test.
 */
function assertCompleteTree(root, label) {
  const problems = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.type === "ERROR" || node.isMissing) {
      problems.push(
        `${node.type}${node.isMissing ? " (MISSING)" : ""} at ` +
          `${node.startPosition.row + 1}:${node.startPosition.column + 1}`
      );
    }
    for (let i = node.childCount - 1; i >= 0; i--) {
      stack.push(node.child(i));
    }
  }

  assert.ok(!root.hasError, `[${label}] Parse tree reports a syntax error`);
  assert.deepStrictEqual(
    problems,
    [],
    `[${label}] Parse tree contains recovery nodes:\n${problems.join("\n")}`
  );
}

/**
 * Parse a file and verify the result by comparing with .ast snapshot file.
 *
 * Reads the expected S-expression from the corresponding .ast file
 * and compares it with the actual parse tree output.
 */
function verifyParseResult(parser, filepath, label) {
  const source = fs.readFileSync(filepath, "utf-8");
  const tree = parser.parse(source);
  const root = tree.rootNode;

  assertCompleteTree(root, label);

  // Generate actual S-expression
  const actualSexp = root.toString();

  // Read expected S-expression from .ast file
  const astPath = filepath.replace(/\.cj$/, ".ast");
  assert.ok(
    fs.existsSync(astPath),
    `[${label}] Snapshot file not found: ${astPath}\n` +
      "Run 'npm run snapshots:update' from the repository root."
  );
  const expectedSexp = fs.readFileSync(astPath, "utf-8").trim();

  assert.strictEqual(
    actualSexp,
    expectedSexp,
    `[${label}] Parse tree does not match .ast snapshot.`
  );
}

// ============================================================================
// Tests
// ============================================================================

describe("Parser setup", () => {
  test("can load grammar", () => {
    const parser = new Parser();
    assert.doesNotThrow(() => parser.setLanguage(Cangjie));
  });

  test("can parse empty source", () => {
    const parser = new Parser();
    parser.setLanguage(Cangjie);
    const tree = parser.parse("");
    assert.ok(tree);
    assert.strictEqual(tree.rootNode.type, "translationUnit");
  });
});

describe("Semantic node regressions", () => {
  const parser = new Parser();
  parser.setLanguage(Cangjie);

  function nodesOfType(root, type) {
    const matches = [];
    const stack = [root];
    while (stack.length > 0) {
      const node = stack.pop();
      if (node.type === type) matches.push(node);
      for (let i = node.childCount - 1; i >= 0; i--) {
        stack.push(node.child(i));
      }
    }
    return matches;
  }

  test("true and false are booleanLiteral nodes", () => {
    const tree = parser.parse("main() { let yes = true; let no = false }\n");
    assertCompleteTree(tree.rootNode, "boolean literals");
    assert.deepStrictEqual(
      nodesOfType(tree.rootNode, "booleanLiteral").map((node) => node.text),
      ["true", "false"]
    );
    assert.ok(
      !nodesOfType(tree.rootNode, "varBindingPattern")
        .some((node) => node.text === "true" || node.text === "false")
    );
  });

  test("enum constructors keep their name and optional payload together", () => {
    const tree = parser.parse(
      "enum Result<T> { None | Ok(T) | Err(Int64, String) }\n"
    );
    assertCompleteTree(tree.rootNode, "enum constructors");
    const constructors = nodesOfType(tree.rootNode, "enumConstructor");
    assert.deepStrictEqual(
      constructors.map((node) => node.childForFieldName("name").text),
      ["None", "Ok", "Err"]
    );
    assert.equal(constructors[0].childForFieldName("payload"), null);
    assert.equal(constructors[1].childForFieldName("payload").text, "(T)");
    assert.equal(
      constructors[2].childForFieldName("payload").text,
      "(Int64, String)"
    );
  });
});

describe("Testcase fixtures", () => {
  const parser = new Parser();
  parser.setLanguage(Cangjie);

  const testcaseFiles = findCjFiles(TESTCASE_DIR);

  for (const filepath of testcaseFiles) {
    const relpath = path.relative(TESTCASE_DIR, filepath);
    test(`parse ${relpath}`, () => {
      verifyParseResult(parser, filepath, relpath);
    });
  }
});

describe("Trailing newline sensitivity", () => {
  const parser = new Parser();
  parser.setLanguage(Cangjie);

  /**
   * Helper to verify that code parses identically with and without a trailing
   * newline, and that neither parse produces errors or MISSING nodes.
   */
  function assertNewlineInsensitive(code, label) {
    const withNL = parser.parse(code.endsWith("\n") ? code : code + "\n");
    const withoutNL = parser.parse(code.replace(/\n$/, ""));

    const sexpWith = withNL.rootNode.toString();
    const sexpWithout = withoutNL.rootNode.toString();

    assert.ok(
      !withNL.rootNode.hasError,
      `[${label}] with trailing newline should not have errors`
    );
    assert.ok(
      !withoutNL.rootNode.hasError,
      `[${label}] without trailing newline should not have errors`
    );
    assert.ok(
      !sexpWithout.includes("MISSING"),
      `[${label}] without trailing newline should not contain MISSING nodes`
    );
    assert.strictEqual(
      sexpWith,
      sexpWithout,
      `[${label}] AST should be identical with and without trailing newline`
    );
  }

  test("package declaration", () => {
    assertNewlineInsensitive("package test\n", "package only");
  });

  test("macro package declaration", () => {
    assertNewlineInsensitive("macro package mymacros\n", "macro package");
  });

  test("import statement", () => {
    assertNewlineInsensitive("import std.io\n", "import");
  });

  test("multiple imports", () => {
    assertNewlineInsensitive(
      "import std.io\nimport std.collection\n",
      "multiple imports"
    );
  });

  test("package and import", () => {
    assertNewlineInsensitive(
      "package test\nimport std.io\n",
      "package + import"
    );
  });

  test("package import and class", () => {
    assertNewlineInsensitive(
      "package test\nimport std.io\nclass Foo {}\n",
      "package + import + class"
    );
  });

  test("class definition", () => {
    assertNewlineInsensitive("class Foo {}\n", "class only");
  });

  test("main function", () => {
    assertNewlineInsensitive(
      "main() {\n    return 0\n}\n",
      "main function"
    );
  });

  test("variable declaration", () => {
    assertNewlineInsensitive("let x = 42\n", "variable declaration");
  });

  test("full program", () => {
    assertNewlineInsensitive(
      "package test\nimport std.io\nmain() {\n    let x = 1\n}\n",
      "full program"
    );
  });
});
