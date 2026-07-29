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

tree.delete();
parser.delete();

console.log(`WASM parsed Cangjie successfully: ${wasmPath}`);
