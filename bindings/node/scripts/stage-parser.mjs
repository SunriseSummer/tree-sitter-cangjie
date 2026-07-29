import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const repositoryRoot = path.resolve(packageRoot, "..", "..");
const parserRoot = path.join(repositoryRoot, "parser");
const requireWasm = process.argv.includes("--require-wasm");
const cleanOnly = process.argv.includes("--clean");

const stagedPaths = [
  "grammar",
  "queries",
  "src/parser.c",
  "src/scanner.c",
  "src/grammar.json",
  "src/node-types.json",
  "src/tree_sitter",
  "tree-sitter.json",
  "tree-sitter-cangjie.wasm",
  "LICENSE",
];

const repositoryCheckout =
  path.resolve(repositoryRoot, "bindings", "node") === packageRoot &&
  fs.existsSync(path.join(parserRoot, "package.json")) &&
  fs.existsSync(path.join(parserRoot, "tree-sitter.json"));

function cleanStagedFiles() {
  if (!repositoryCheckout) {
    console.log("staged parser cleanup skipped outside the source repository");
    return;
  }
  for (const relativePath of stagedPaths) {
    fs.rmSync(path.join(packageRoot, relativePath), {
      recursive: true,
      force: true,
    });
  }
  console.log("removed staged parser files from bindings/node");
}

function assertFile(filePath, description) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`${description} is missing: ${filePath}`);
  }
}

function validateStagedPackage() {
  for (const relativePath of [
    "src/parser.c",
    "src/tree_sitter/parser.h",
    "queries/highlights.scm",
    "tree-sitter.json",
    "LICENSE",
  ]) {
    assertFile(path.join(packageRoot, relativePath), "staged parser file");
  }
  if (requireWasm) {
    assertFile(
      path.join(packageRoot, "tree-sitter-cangjie.wasm"),
      "staged WASM module"
    );
  }
}

if (cleanOnly) {
  cleanStagedFiles();
  process.exit(0);
}

if (!repositoryCheckout) {
  validateStagedPackage();
  console.log("using parser files already included in the npm package");
  process.exit(0);
}

for (const relativePath of [
  "src/parser.c",
  "src/tree_sitter/parser.h",
  "queries/highlights.scm",
  "tree-sitter.json",
]) {
  assertFile(path.join(parserRoot, relativePath), "repository parser file");
}
assertFile(path.join(repositoryRoot, "LICENSE"), "repository license");
if (requireWasm) {
  assertFile(
    path.join(parserRoot, "tree-sitter-cangjie.wasm"),
    "repository WASM module"
  );
}

cleanStagedFiles();
fs.cpSync(path.join(parserRoot, "grammar"), path.join(packageRoot, "grammar"), {
  recursive: true,
});
fs.cpSync(path.join(parserRoot, "queries"), path.join(packageRoot, "queries"), {
  recursive: true,
  filter: (source) =>
    !path
      .relative(path.join(parserRoot, "queries"), source)
      .split(path.sep)
      .includes("tests"),
});

for (const relativePath of [
  "parser.c",
  "scanner.c",
  "grammar.json",
  "node-types.json",
]) {
  const source = path.join(parserRoot, "src", relativePath);
  if (fs.existsSync(source)) {
    fs.mkdirSync(path.join(packageRoot, "src"), { recursive: true });
    fs.copyFileSync(source, path.join(packageRoot, "src", relativePath));
  }
}
fs.cpSync(
  path.join(parserRoot, "src", "tree_sitter"),
  path.join(packageRoot, "src", "tree_sitter"),
  { recursive: true }
);
fs.copyFileSync(
  path.join(parserRoot, "tree-sitter.json"),
  path.join(packageRoot, "tree-sitter.json")
);
fs.copyFileSync(
  path.join(repositoryRoot, "LICENSE"),
  path.join(packageRoot, "LICENSE")
);

const wasmSource = path.join(parserRoot, "tree-sitter-cangjie.wasm");
if (fs.existsSync(wasmSource)) {
  fs.copyFileSync(
    wasmSource,
    path.join(packageRoot, "tree-sitter-cangjie.wasm")
  );
}

validateStagedPackage();
console.log("staged parser sources and runtime assets for bindings/node");
