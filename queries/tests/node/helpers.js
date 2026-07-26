/**
 * Shared utilities for tree-sitter-cangjie SCM query tests (Node.js).
 *
 * Provides helper functions for loading queries, parsing files,
 * and running query captures.
 */

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const Parser = require("tree-sitter");
const Cangjie = require("../../..");

const QUERIES_DIR = path.resolve(__dirname, "..", "..");
const TESTCASE_DIR = path.resolve(__dirname, "..", "testcase");

/**
 * Create a parser with the Cangjie language loaded.
 */
function getParser() {
  const parser = new Parser();
  parser.setLanguage(Cangjie);
  return parser;
}

/**
 * Get the tree-sitter language object.
 */
function getLanguage() {
  const parser = new Parser();
  parser.setLanguage(Cangjie);
  return parser.getLanguage();
}

/**
 * Load a .scm query file and compile it.
 */
function loadQuery(lang, scmFilename) {
  const scmPath = path.join(QUERIES_DIR, scmFilename);
  const queryText = fs.readFileSync(scmPath, "utf-8");
  return new Parser.Query(lang, queryText);
}

/**
 * Parse a Cangjie source file.
 */
function parseFile(parser, filepath) {
  const source = fs.readFileSync(filepath, "utf-8");
  return { tree: parser.parse(source), source };
}

/**
 * Run a query on a test .cj file and return captures grouped by name.
 * @returns {Object.<string, Array<{text: string, type: string, startPosition: Object, endPosition: Object}>>}
 */
function runQueryCaptures(lang, query, parser, cjFilename) {
  const cjPath = path.join(TESTCASE_DIR, cjFilename);
  const { tree } = parseFile(parser, cjPath);
  assert.equal(tree.rootNode.hasError, false, `${cjFilename} must parse without recovery`);

  // Query capture names such as `constructor` are valid. A null-prototype map
  // prevents them from colliding with Object.prototype properties.
  const captures = Object.create(null);
  const results = query.captures(tree.rootNode);
  for (const { name, node } of results) {
    if (!captures[name]) captures[name] = [];
    captures[name].push({
      text: node.text,
      type: node.type,
      startPosition: node.startPosition,
      endPosition: node.endPosition,
    });
  }
  return captures;
}

/** Run a query and preserve the captures belonging to each individual match. */
function runQueryMatches(lang, query, parser, cjFilename) {
  const cjPath = path.join(TESTCASE_DIR, cjFilename);
  const { tree } = parseFile(parser, cjPath);
  assert.equal(tree.rootNode.hasError, false, `${cjFilename} must parse without recovery`);
  return query.matches(tree.rootNode).map(({ pattern, captures }) => ({
    pattern,
    captures: captures.map(({ name, node }) => ({
      name,
      text: node.text,
      type: node.type,
      startPosition: node.startPosition,
      endPosition: node.endPosition,
    })),
  }));
}

module.exports = {
  QUERIES_DIR,
  TESTCASE_DIR,
  getParser,
  getLanguage,
  loadQuery,
  parseFile,
  runQueryCaptures,
  runQueryMatches,
};
