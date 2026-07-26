/**
 * tree-sitter-cangjie SCM 查询测试 — 总入口 (Node.js)
 *
 * 运行所有 SCM 查询测试。
 *
 * Usage:
 *     cd tree-sitter-cangjie
 *     node --test queries/tests/node/run_all.js
 */

require("./test_compilation");
require("./test_highlights");
require("./test_indents");
require("./test_locals");
require("./test_tags");
require("./test_textobjects");
