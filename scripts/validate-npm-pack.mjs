import assert from "node:assert/strict";
import fs from "node:fs";
import process from "node:process";

const reportPath = process.argv[2];
assert.ok(reportPath, "usage: node scripts/validate-npm-pack.mjs <pack.json>");

const report = JSON.parse(
  fs.readFileSync(reportPath, "utf8").replace(/^\uFEFF/, "")
);
assert.equal(report.length, 1, "npm pack must produce exactly one package");

const packageInfo = report[0];
const files = new Set(packageInfo.files.map(({ path }) => path));
const requiredFiles = [
  "LICENSE",
  "README.md",
  "binding.gyp",
  "index.js",
  "index.d.ts",
  "grammar/common.js",
  "grammar/expression.js",
  "grammar/literal.js",
  "grammar/main.js",
  "grammar/toplevelobjects.js",
  "grammar/types.js",
  "queries/highlights.scm",
  "queries/indents.scm",
  "queries/locals.scm",
  "queries/tags.scm",
  "queries/textobjects.scm",
  "scripts/stage-parser.mjs",
  "src/binding.cc",
  "src/grammar.json",
  "src/parser.c",
  "src/scanner.c",
  "src/node-types.json",
  "src/tree_sitter/parser.h",
  "tree-sitter.json",
  "tree-sitter-cangjie.wasm",
  "prebuilds/darwin-arm64/tree-sitter-cangjie.node",
  "prebuilds/darwin-x64/tree-sitter-cangjie.node",
  "prebuilds/linux-arm64/tree-sitter-cangjie.node",
  "prebuilds/linux-x64/tree-sitter-cangjie.node",
  "prebuilds/win32-arm64/tree-sitter-cangjie.node",
  "prebuilds/win32-x64/tree-sitter-cangjie.node",
];

for (const requiredFile of requiredFiles) {
  assert.ok(files.has(requiredFile), `npm package is missing ${requiredFile}`);
}

const forbidden = [...files].filter(
  (file) =>
    file.startsWith("tests/") ||
    file.startsWith("queries/tests/") ||
    (file.startsWith("scripts/") &&
      file !== "scripts/stage-parser.mjs") ||
    file.startsWith("bindings/") ||
    file.startsWith("parser/") ||
    file.includes("__pycache__") ||
    file.endsWith(".pyc")
);
assert.deepEqual(forbidden, [], `unexpected npm files: ${forbidden.join(", ")}`);

console.log(
  `npm pack validated: ${packageInfo.name}@${packageInfo.version}, ` +
    `${files.size} files`
);
