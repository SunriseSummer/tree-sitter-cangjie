/**
 * 使用 tree-sitter-cangjie 解析仓颉源代码并展示语法树。
 *
 * 本脚本演示如何通过 Node.js 的 tree-sitter 绑定加载 tree-sitter-cangjie 插件，
 * 解析仓颉源文件，输出完整语法树（S-expression），遍历节点打印结构化信息，
 * 并使用 tree-sitter Query 语法提取顶层定义（函数、类、接口、枚举）。
 *
 * 使用方式详见 readme.md。
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const Parser = require("tree-sitter");

// 根据当前平台自动选择预编译插件
function loadCangjieLanguage() {
  const platform = process.platform; // 'linux', 'darwin', 'win32'
  const arch = process.arch;         // 'x64', 'arm64'
  let suffix;
  if (platform === "linux" && arch === "x64") {
    suffix = "linux-x64";
  } else if (platform === "darwin" && arch === "arm64") {
    suffix = "macos-arm64";
  } else if (platform === "win32" && arch === "x64") {
    suffix = "win-x64";
  } else {
    throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }
  const nodePath = path.join(
    __dirname, "..", "..", "release",
    `tree_sitter_cangjie-${suffix}.node`
  );
  return require(nodePath);
}

const Cangjie = loadCangjieLanguage();

/**
 * 递归打印语法树，显示节点类型、位置和（叶子节点的）文本。
 */
function printTree(node, source, indent = 0) {
  const prefix = "  ".repeat(indent);
  const start = node.startPosition;
  const end = node.endPosition;

  if (node.childCount === 0) {
    const text = source.slice(node.startIndex, node.endIndex);
    console.log(
      `${prefix}${node.type} [${start.row}:${start.column}-${end.row}:${end.column}] "${text}"`
    );
  } else {
    console.log(
      `${prefix}${node.type} [${start.row}:${start.column}-${end.row}:${end.column}]`
    );
    for (let i = 0; i < node.childCount; i++) {
      printTree(node.child(i), source, indent + 1);
    }
  }
}

/**
 * 递归统计节点总数。
 */
function countNodes(node) {
  let count = 1;
  for (let i = 0; i < node.childCount; i++) {
    count += countNodes(node.child(i));
  }
  return count;
}

/**
 * 使用 tree-sitter Query 提取顶层定义（函数、类、接口、枚举）。
 * 返回格式：[{ kind, name, line }]
 */
function queryDefinitions(root, source) {
  const querySource = `
    (functionDefinition (funcName) @func)
    (classDefinition    (className) @class)
    (interfaceDefinition (interfaceName) @interface)
    (enumDefinition     (enumName) @enum)
  `;
  const query = new Parser.Query(Cangjie, querySource);
  const captures = query.captures(root);
  return captures.map(({ name, node }) => ({
    kind: name,
    name: source.slice(node.startIndex, node.endIndex),
    line: node.startPosition.row + 1,
  }));
}

/**
 * 递归收集所有错误节点。
 */
function collectErrors(node, errors = []) {
  if (node.isError || node.isMissing) {
    errors.push(node);
  }
  for (let i = 0; i < node.childCount; i++) {
    collectErrors(node.child(i), errors);
  }
  return errors;
}

function main() {
  const samplePath = path.join(__dirname, "..", "sample.cj");
  if (!fs.existsSync(samplePath)) {
    console.error(`Error: sample file not found: ${samplePath}`);
    process.exit(1);
  }

  // 初始化解析器
  const parser = new Parser();
  parser.setLanguage(Cangjie);

  // 读取并解析源文件
  const source = fs.readFileSync(samplePath, "utf-8");
  const tree = parser.parse(source);
  const root = tree.rootNode;

  // 1. 输出 S-expression
  console.log("=== S-expression ===");
  console.log(root.toString());

  // 2. 输出结构化语法树
  console.log("\n=== Syntax Tree ===");
  printTree(root, source);

  // 3. 统计信息
  const total = countNodes(root);
  console.log(`\nTotal nodes: ${total}`);
  console.log(`Root node type: ${root.type}`);
  console.log(`Has errors: ${root.hasError}`);

  // 4. Query：提取顶层定义
  console.log("\n=== Definitions (via Query) ===");
  const defs = queryDefinitions(root, source);
  for (const { kind, name, line } of defs) {
    console.log(`  [line ${String(line).padStart(2)}] @${kind}: ${name}`);
  }

  // 5. 错误节点检测
  console.log("\n=== Parse Errors ===");
  const errors = collectErrors(root);
  if (errors.length === 0) {
    console.log("  No parse errors.");
  } else {
    for (const e of errors) {
      const start = e.startPosition;
      console.log(
        `  ${e.isMissing ? "MISSING" : "ERROR"} at ${start.row + 1}:${start.column + 1}`
      );
    }
  }

  // 6. 增量解析演示：修改源代码后重解析
  console.log("\n=== Incremental Parsing Demo ===");
  const appendedCode = "\n// 新增函数\nfunc square(x: Int64): Int64 {\n    return x * x\n}\n";
  const newSource = source + appendedCode;
  const startIndex = source.length;
  const startPoint = { row: source.split("\n").length - 1, column: 0 };

  tree.edit({
    startIndex,
    oldEndIndex: startIndex,
    newEndIndex: startIndex + appendedCode.length,
    startPosition: startPoint,
    oldEndPosition: startPoint,
    newEndPosition: { row: startPoint.row + appendedCode.split("\n").length - 1, column: 0 },
  });

  const newTree = parser.parse(newSource, tree);
  const newRoot = newTree.rootNode;
  const newDefs = queryDefinitions(newRoot, newSource);
  console.log(`  After appending a new function, found ${newDefs.length} definitions:`);
  for (const { kind, name } of newDefs) {
    console.log(`    @${kind}: ${name}`);
  }
}

main();
