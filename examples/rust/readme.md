# Rust 示例：使用 tree-sitter-cangjie 解析仓颉代码

本示例演示如何在 Rust 中使用 `tree-sitter` 和 `tree-sitter-cangjie` 解析仓颉源代码，输出完整的语法树（S-expression），遍历节点打印结构化信息，并使用 Query API 提取顶层定义。

## 技术原理

[tree-sitter](https://tree-sitter.github.io/) 是一个增量解析框架，可为多种语言提供高效的语法解析。`tree-sitter-cangjie` 的 Rust 绑定使用 `cc` crate 在构建时编译 C 解析器源码（`src/parser.c` 和 `src/scanner.c`），通过 `extern "C"` FFI 声明引入 `tree_sitter_cangjie()` 函数。

工作流程：

1. Cargo 构建时，`build.rs` 使用 `cc` crate 编译 C 解析器源码为静态库。
2. 通过 `extern "C"` FFI 调用 `tree_sitter_cangjie()` 获取 `TSLanguage` 指针，封装为 `LanguageFn` 常量 `LANGUAGE`。
3. 创建 `tree_sitter::Parser`，调用 `set_language(&LANGUAGE.into())` 设置仓颉语言。
4. 调用 `parser.parse()` 将源代码解析为语法树，通过 `root_node()` 获取根节点，递归遍历子节点即可获取完整的语法结构。
5. 使用 `Query::new()` 创建查询，`QueryCursor::matches()` 配合 `StreamingIterator` 提取定义信息。
6. 演示通过 `tree.edit()` + 重解析实现增量解析。

## 前置条件

- Rust 工具链（rustc + cargo）
- C 编译器（gcc / clang，`cc` crate 编译需要）

## 构建与运行

```bash
cd examples/rust
cargo run
```

或先构建再运行：

```bash
cd examples/rust
cargo build
./target/debug/cangjie-parser-example
```

## 输出说明

程序将输出六部分内容：

1. **S-expression**：完整的语法树 S-expression 表示，与 `tree-sitter parse` 命令输出一致。
2. **Syntax Tree**：结构化的语法树，显示每个节点的类型、行列位置，叶子节点还附带对应的源代码文本。
3. **统计信息**：节点总数、根节点类型、是否存在解析错误。
4. **Definitions (via Query)**：使用 tree-sitter Query 提取所有顶层函数、类、接口、枚举定义及其行号。
5. **Parse Errors**：检测并报告语法树中的错误节点。
6. **Incremental Parsing Demo**：演示 `tree.edit()` + 重解析，展示在源码末尾追加新函数后的定义列表变化。

## 文件说明

| 文件 | 说明 |
|------|------|
| `src/main.rs` | 示例程序入口 |
| `Cargo.toml` | Rust 项目配置，通过路径依赖引用 `bindings/rust` |
| `../sample.cj` | 共用的仓颉示例源文件 |
