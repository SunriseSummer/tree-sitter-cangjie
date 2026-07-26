#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const Parser = require("tree-sitter");
const Cangjie = require("..");

const TESTCASE_DIR = path.join(__dirname, "testcase");

function findCjFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...findCjFiles(fullPath));
    else if (entry.name.endsWith(".cj")) files.push(fullPath);
  }
  return files.sort();
}

function main() {
  const parser = new Parser();
  parser.setLanguage(Cangjie);
  const updates = [];

  for (const sourcePath of findCjFiles(TESTCASE_DIR)) {
    const source = fs.readFileSync(sourcePath, "utf8");
    const tree = parser.parse(source);
    const sexp = tree.rootNode.toString();
    if (tree.rootNode.hasError || sexp.includes("(ERROR") || sexp.includes("MISSING")) {
      throw new Error(`Refusing to snapshot a recovered tree: ${sourcePath}`);
    }
    updates.push({ sourcePath, sexp });
  }

  for (const { sourcePath, sexp } of updates) {
    fs.writeFileSync(sourcePath.replace(/\.cj$/, ".ast"), `${sexp}\n`, "utf8");
  }
  console.log(`Generated ${updates.length} AST snapshots.`);
}

if (require.main === module) main();

module.exports = { findCjFiles, main };
