#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const Parser = require("tree-sitter");
const Cangjie = require("..");

const CORPUS_DIR = path.join(__dirname, "corpus");

function readCases(text, filePath) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const cases = [];
  let index = 0;

  while (index < lines.length) {
    while (index < lines.length && lines[index].trim() === "") index++;
    if (index >= lines.length) break;

    const delimiter = lines[index].trim();
    if (!/^=+$/.test(delimiter)) {
      throw new Error(`Expected test delimiter in ${filePath}:${index + 1}`);
    }
    const title = (lines[index + 1] || "").trim();
    if (!title || (lines[index + 2] || "").trim() !== delimiter) {
      throw new Error(`Invalid corpus header in ${filePath}:${index + 1}`);
    }
    index += 3;
    if (lines[index] === "") index++;

    const sourceLines = [];
    while (index < lines.length && lines[index].trim() !== "---") {
      sourceLines.push(lines[index++]);
    }
    if (index >= lines.length) throw new Error(`Missing separator for ${title}`);
    index++;
    if (lines[index] === "") index++;

    while (index < lines.length) {
      const current = lines[index].trim();
      const next = (lines[index + 1] || "").trim();
      const third = (lines[index + 2] || "").trim();
      if (/^=+$/.test(current) && next && third === current) break;
      index++;
    }

    cases.push({ delimiter, title, source: sourceLines.join("\n").trimEnd() });
  }
  return cases;
}

function main() {
  const parser = new Parser();
  parser.setLanguage(Cangjie);
  const files = fs.readdirSync(CORPUS_DIR)
    .filter((name) => name.endsWith(".txt"))
    .sort();

  for (const filename of files) {
    const filePath = path.join(CORPUS_DIR, filename);
    const cases = readCases(fs.readFileSync(filePath, "utf8"), filePath);
    const sections = cases.map(({ delimiter, title, source }) => {
      const tree = parser.parse(`${source}\n`);
      const sexp = tree.rootNode.toString();
      if (tree.rootNode.hasError || sexp.includes("(ERROR") || sexp.includes("MISSING")) {
        throw new Error(`Refusing to record a recovered tree: ${filename} :: ${title}`);
      }
      return `${delimiter}\n${title}\n${delimiter}\n\n${source}\n\n---\n\n${sexp}`;
    });
    fs.writeFileSync(filePath, `${sections.join("\n\n")}\n`, "utf8");
    console.log(`Updated ${filename}: ${cases.length} cases.`);
  }
}

if (require.main === module) main();

module.exports = { main, readCases };
