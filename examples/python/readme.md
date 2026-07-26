# Python 示例：使用 tree-sitter-cangjie 解析仓颉代码

本示例演示如何在 Python 中使用 `tree-sitter` 和 `tree-sitter-cangjie` 解析仓颉源代码，输出完整的语法树（S-expression），遍历节点打印结构化信息，并使用 QueryCursor 提取顶层定义。

## 技术原理

[tree-sitter](https://tree-sitter.github.io/) 是一个增量解析框架，可为多种语言提供高效的语法解析。`tree-sitter-cangjie` 是仓颉语言的 tree-sitter 语法插件，以 CPython C 扩展的方式提供 Python 绑定。

工作流程：

1. 通过 `tree_sitter_cangjie.language()` 获取仓颉语言的 `TSLanguage` 指针（经 `PyCapsule` 封装）。
2. 使用 `tree_sitter.Language` 包装该指针，再传给 `tree_sitter.Parser` 创建解析器。
3. 调用 `parser.parse()` 将源代码解析为具体语法树（CST），返回 `Tree` 对象。
4. 通过 `Tree.root_node` 访问根节点，递归遍历子节点即可获取完整的语法结构。
5. 使用 `tree_sitter.QueryCursor` 执行 Query 查询，提取函数、类、接口、枚举等定义。
6. 演示通过 `tree.edit()` + 重解析实现增量解析（`tree_sitter` 0.25 Python API）。

## 前置条件

- Python >= 3.10

## 构建与运行

1. 安装依赖：

```bash
pip install tree-sitter~=0.25
pip install ../../release/tree_sitter_cangjie-1.0.5-cp310-abi3-linux_x86_64.whl
```

> 注意：wheel 文件名可能因版本不同而变化，请根据 `release/` 目录下的实际文件名替换。

2. 运行示例：

```bash
python parse_cangjie.py
```

## 输出说明

脚本将输出七部分内容：

1. **S-expression**：完整的语法树 S-expression 表示，与 `tree-sitter parse` 命令输出一致。
2. **Syntax Tree**：结构化的语法树，显示每个节点的类型、行列位置，叶子节点还附带对应的源代码文本。
3. **统计信息**：节点总数、根节点类型、是否存在解析错误。
4. **Definitions (via Query)**：使用 `QueryCursor` 执行 tree-sitter Query，提取所有顶层函数、类、接口、枚举定义及其行号。
5. **Parse Errors**：检测并报告语法树中的错误节点。
6. **TreeCursor Walk**：使用 `TreeCursor` 高效遍历语法树，展示前 20 个命名节点。
7. **Incremental Parsing Demo**：演示 `tree.edit()` + 重解析，展示在源码末尾追加新函数后的定义列表变化。

## 文件说明

| 文件 | 说明 |
|------|------|
| `parse_cangjie.py` | 示例脚本 |
| `../sample.cj` | 共用的仓颉示例源文件 |
