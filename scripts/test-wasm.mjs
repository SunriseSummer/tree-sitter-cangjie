import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Language, Parser } from "web-tree-sitter";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const wasmPath = path.resolve(
  process.argv[2] ??
    path.join(repositoryRoot, "parser", "tree-sitter-cangjie.wasm")
);
assert.ok(fs.existsSync(wasmPath), `WASM file does not exist: ${wasmPath}`);

await Parser.init();
const language = await Language.load(wasmPath);
const parser = new Parser();
parser.setLanguage(language);

const source = [
  "package release_test",
  "",
  "main() {",
  '    println("Hello, Cangjie!")',
  "}",
  "",
].join("\n");
const tree = parser.parse(source);

assert.equal(tree.rootNode.type, "translationUnit");
assert.equal(tree.rootNode.hasError, false, tree.rootNode.toString());
assert.ok(
  tree.rootNode.toString().includes("mainDefinition"),
  tree.rootNode.toString()
);

// Run every version-specific fixture through the actual WASM grammar.
const version = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "language-version.json")));
let versionCases = 0;
for (const filename of version.fixtures) {
  const cases = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "tests/fixtures/versions", filename)));
  for (const entry of cases) {
    const result = parser.parse(entry.source);
    assert.equal(result.rootNode.hasError, false, `${entry.name}: ${result.rootNode.toString()}`);
    for (const [type, count] of Object.entries(entry.nodes)) {
      assert.equal(result.rootNode.descendantsOfType(type).filter(n => n.isNamed).length, count, `${entry.name}: ${type}`);
    }
    result.delete();
    versionCases++;
  }
}
console.log(`WASM version fixtures passed: ${versionCases}`);

tree.delete();
parser.delete();

console.log(`WASM parsed Cangjie successfully: ${wasmPath}`);
