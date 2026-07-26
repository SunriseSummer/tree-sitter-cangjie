# C 示例：使用 tree-sitter-cangjie 解析仓颉代码

本示例演示如何在 C 中使用 `tree-sitter` 和 `tree-sitter-cangjie` 解析仓颉源代码，输出语法树的 S-expression 并遍历节点打印结构化信息，并使用 Query API 提取顶层定义。

## 技术原理

[tree-sitter](https://tree-sitter.github.io/) 是一个用 C 编写的增量解析框架。`tree-sitter-cangjie` 将仓颉语言的语法规则编译为 C 静态库（`.a`），通过链接即可在 C/C++ 项目中使用。

工作流程：

1. 调用 `tree_sitter_cangjie()` 获取仓颉语言的 `TSLanguage` 指针。
2. 创建 `TSParser`，调用 `ts_parser_set_language()` 设置语言。
3. 调用 `ts_parser_parse_string()` 将源代码解析为语法树，返回 `TSTree` 指针。
4. 通过 `ts_tree_root_node()` 获取根节点，递归遍历子节点即可获取完整的语法结构。
5. 使用 `ts_query_new()` 创建查询，`ts_query_cursor_exec()` 执行查询提取定义信息。
6. 使用 `ts_tree_edit()` 描述编辑操作，再次调用 `ts_parser_parse_string()` 进行增量重解析。
7. 使用完毕后调用 `ts_tree_delete()` 和 `ts_parser_delete()` 释放资源。

## 前置条件

- C 编译器（gcc / clang）
- 无需安装任何系统依赖，所有库均预置于 `release/` 目录

## 构建与运行

```bash
cd examples/c
make
make run
```

也可以手动运行：

```bash
./parse_cangjie
```

## 输出说明

程序将输出六部分内容：

1. **S-expression**：完整的语法树 S-expression 表示，与 `tree-sitter parse` 命令输出一致。
2. **Syntax Tree**：结构化的语法树，显示每个节点的类型、行列位置，叶子节点还附带对应的源代码文本。
3. **统计信息**：节点总数、根节点类型、是否存在解析错误。
4. **Definitions (via Query)**：使用 tree-sitter Query 提取所有顶层函数、类、接口、枚举定义及其行号。
5. **Parse Errors**：检测并报告语法树中的错误节点。
6. **Incremental Parsing Demo**：演示 `ts_tree_edit()` + 重解析，展示在源码末尾追加新函数后的定义列表变化。

## 文件说明

| 文件 | 说明 |
|------|------|
| `parse_cangjie.c` | 示例 C 源文件 |
| `Makefile` | 构建配置，引用 `release/libtree-sitter-0.25.a` 和 `release/tree-sitter-0.25/api.h` |
| `../sample.cj` | 共用的仓颉示例源文件 |
