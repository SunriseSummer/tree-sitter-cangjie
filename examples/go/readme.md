# Go 示例：使用 tree-sitter-cangjie 解析仓颉代码

本示例演示如何在 Go 中使用 `go-tree-sitter` 和 `tree-sitter-cangjie` 解析仓颉源代码，输出完整的语法树（S-expression），遍历节点打印结构化信息，并使用 Query API 提取顶层定义。

## 技术原理

[tree-sitter](https://tree-sitter.github.io/) 是一个增量解析框架，可为多种语言提供高效的语法解析。`tree-sitter-cangjie` 的 Go 绑定通过 cgo 机制直接在 Go 源文件中内联编译 C 解析器源码（`src/parser.c` 和 `src/scanner.c`），无需预编译的二进制库。

工作流程：

1. 通过 cgo 内联编译 C 解析器源码，调用 `tree_sitter_cangjie()` 获取 `TSLanguage` 指针，并以 `unsafe.Pointer` 返回。
2. 使用 `go-tree-sitter` 库的 `NewLanguage()` 包装该指针为 Go 的 `Language` 对象。
3. 创建 `Parser` 并调用 `SetLanguage()` 设置仓颉语言。
4. 调用 `parser.Parse()` 将源代码解析为语法树，通过 `RootNode()` 获取根节点，递归遍历子节点即可获取完整的语法结构。
5. 使用 `tree_sitter.NewQuery()` 创建查询，`QueryCursor.Matches()` 提取定义信息。
6. 演示通过 `tree.Edit()` + 重解析实现增量解析。

## 前置条件

- Go >= 1.22
- C 编译器（gcc / clang，cgo 编译需要）

## 构建与运行

```bash
cd examples/go
go build -o parse_cangjie .
./parse_cangjie
```

或直接运行：

```bash
cd examples/go
go run .
```

## 输出说明

程序将输出六部分内容：

1. **S-expression**：完整的语法树 S-expression 表示，与 `tree-sitter parse` 命令输出一致。
2. **Syntax Tree**：结构化的语法树，显示每个节点的类型、行列位置，叶子节点还附带对应的源代码文本。
3. **统计信息**：节点总数、根节点类型、是否存在解析错误。
4. **Definitions (via Query)**：使用 tree-sitter Query 提取所有顶层函数、类、接口、枚举定义及其行号。
5. **Parse Errors**：检测并报告语法树中的错误节点。
6. **Incremental Parsing Demo**：演示 `tree.Edit()` + 重解析，展示在源码末尾追加新函数后的定义列表变化。

## 文件说明

| 文件 | 说明 |
|------|------|
| `main.go` | 示例程序入口 |
| `go.mod` | Go 模块配置，声明依赖和本地 replace 指令 |
| `go.sum` | 依赖校验和 |
| `../sample.cj` | 共用的仓颉示例源文件 |
