# Node.js 示例：使用 tree-sitter-cangjie 解析仓颉代码

本示例演示如何在 Node.js 中使用 `tree-sitter` 和 `tree-sitter-cangjie` 解析仓颉源代码，输出完整的语法树（S-expression），遍历节点打印结构化信息，并使用 Query API 提取顶层定义。

## 技术原理

[tree-sitter](https://tree-sitter.github.io/) 是一个增量解析框架，可为多种语言提供高效的语法解析。`tree-sitter-cangjie` 的 Node.js 绑定是通过 N-API（`node-addon-api`）将 C 解析器封装为原生插件（`.node` 文件）。

工作流程：

1. 根据当前平台（`process.platform`/`process.arch`）自动加载 `release/` 目录中对应的预编译插件。
2. 创建 `tree-sitter` 的 `Parser` 实例，调用 `parser.setLanguage()` 设置仓颉语言。
3. 调用 `parser.parse()` 将源代码解析为具体语法树（CST），返回 `Tree` 对象。
4. 通过 `tree.rootNode` 访问根节点，递归遍历子节点即可获取完整的语法结构。
5. 使用 `new Parser.Query(language, pattern)` 创建查询，`query.captures(node)` 提取定义信息。
6. 演示通过 `tree.edit()` + 重解析实现增量解析。

## 前置条件

- Node.js >= 18（推荐 22 LTS，`tree-sitter` 0.25 不支持 Node.js 24+）

## 构建与运行

1. 安装依赖：

```bash
cd examples/node
npm install
```

2. 运行示例：

```bash
npm start
# 或
node parse_cangjie.js
```

## 输出说明

脚本将输出六部分内容：

1. **S-expression**：完整的语法树 S-expression 表示，与 `tree-sitter parse` 命令输出一致。
2. **Syntax Tree**：结构化的语法树，显示每个节点的类型、行列位置，叶子节点还附带对应的源代码文本。
3. **统计信息**：节点总数、根节点类型、是否存在解析错误。
4. **Definitions (via Query)**：使用 tree-sitter Query 提取所有顶层函数、类、接口、枚举定义及其行号。
5. **Parse Errors**：检测并报告语法树中的错误节点。
6. **Incremental Parsing Demo**：演示 `tree.edit()` + 重解析，展示在源码末尾追加新函数后的定义列表变化。

## 文件说明

| 文件 | 说明 |
|------|------|
| `parse_cangjie.js` | 示例脚本 |
| `package.json` | Node.js 项目配置，声明 `tree-sitter` 依赖 |
| `../sample.cj` | 共用的仓颉示例源文件 |
