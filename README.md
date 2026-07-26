# Tree-Sitter-Cangjie

本项目实现仓颉编程语言（1.0.5）的 [tree-sitter](https://tree-sitter.github.io/) 语法解析插件，同时为 C、Go、Node.js、Python、Rust、Swift 提供了 tree-sitter-cangjie 绑定，各绑定的源文件统一组织在 `bindings/` 目录下。

## 构建

### 前置条件

- Node.js（>= 18，推荐 22 LTS）
- C/C++ 编译器
- Python（>= 3.10）

### 生成解析器

```bash
npx tree-sitter generate grammar/main.js
```

生成的核心文件是 `src/parser.c`

### 构建插件

> 需要在 Linux x64 平台执行如下构建脚本，部分构建目标涉及交叉编译

`builder/` 是用 python 实现的构建工具包，可一键构建各语言绑定的 release 库文件，支持命令行参数控制：

```bash
python -m builder                                    # 构建全部目标
python -m builder wasm node-linux-x64                # 仅构建 WASM 和 Node.js Linux
python -m builder c-linux-x64 c-win-x64              # 构建 Linux 和 Windows C 库
python -m builder --auto-install                     # 自动安装缺失的构建工具
python -m builder --list                             # 列出所有可用目标
```

构建产物输出到 `release/` 目录。

## 使用

更多完整的使用示例见 [`examples/`](examples/) 目录，包含 Python、Node.js、C、Go、Rust 五种语言的示例项目。

### 在 Python 中使用

安装`tree-sitter`引擎：

```shell
pip install tree-sitter~=0.25
```

安装`tree-sitter-cangjie`插件：

```shell
pip install release/tree_sitter_cangjie_xxx.whl
```

在 python 程序中使用：

```python
import tree_sitter_cangjie
from tree_sitter import Language, Parser

// 初始化解析器
CJ_LANGUAGE = Language(tree_sitter_cangjie.language())
parser = Parser(CJ_LANGUAGE)

// 解析仓颉代码
tree = parser.parse(b'''
main() {
    println("Hello, Cangjie!")
}
''')

print(tree.root_node.sexp())
```

### 在 Node.js 中使用

安装`tree-sitter`引擎：
```shell
npm install tree-sitter@0.25.0
```

在 node.js 程序中使用：
```javascript
const fs = require("node:fs");
const Parser = require("tree-sitter");
const Cangjie = require("release/tree_sitter_cangjie-linux-x64.node");

function main() {
  // 初始化解析器
  const parser = new Parser();
  parser.setLanguage(Cangjie);

  // 读取并解析源文件
  const source = fs.readFileSync("sample.cj", "utf-8");
  const tree = parser.parse(source);
  const root = tree.rootNode;
  // ...
}
```

## 测试

测试套件位于 `tests/` 目录，提供快照测试，以及更严格的 corpus 基线测试。

testcase + corpus 测试：

```bash
# 按前面指导安装依赖并构建
npm test
```

单独运行 corpus 基线测试：

```bash
npm run test:corpus
```

### 测试内容

测试分为两层：

- `tests/testcase/`：覆盖所有 `.cj` 文件的 AST 快照回归测试，并递归扫描更深层子目录中的示例文件。
- `tests/corpus/`：面向核心语法结构的 corpus 基线测试，逐条校验解析树输出。每条 corpus case 还会额外执行"无末尾换行符"变体测试，确保解析器在代码不以换行符结尾时产生相同的解析结果。

### 测试结果校验

`tests/testcase/` 采用 **AST 快照对比** 的方式校验解析结果：每个 `.cj` 测试文件在同目录下都有一个同名的 `.ast` 文件，其中保存了该文件的预期解析树 S-expression 输出。测试时解析 `.cj` 文件，将实际解析树与 `.ast` 文件内容逐字对比，确保解析结果完全一致。

`tests/corpus/` 采用 **corpus 基线对比**：每个 corpus case 都包含源码片段和对应的预期解析树，`tests/test_corpus.py` 与 `tests/test_corpus.js` 都会额外检查结果中不出现 `ERROR` / `MISSING` 节点，用于约束核心语法结构不被意外破坏。

## 项目文件说明

```
tree-sitter-cangjie/
├── package.json                # npm 配置 / tree-sitter 工具链入口
├── tree-sitter.json            # tree-sitter 元数据
├── grammar/
│   ├── main.js                   # 主语法定义入口
│   ├── expression.js             # 表达式语法定义
│   ├── toplevelobjects.js        # 顶层对象语法定义（类、结构体、枚举等）
│   ├── types.js                  # 类型与模式语法定义
│   ├── literal.js                # 字面量语法（数字、字符串、Rune、字节）
│   └── common.js                 # 通用工具函数
├── src/
│   ├── parser.c                # 生成的解析器 C 代码
│   ├── scanner.c               # 外部扫描器（多行原始字符串，支持单/双引号）
│   ├── grammar.json            # 生成的语法 JSON
│   └── node-types.json         # 节点类型定义
├── queries/
│   ├── highlights.scm          # 语法高亮查询
│   ├── indents.scm             # 缩进规则
│   ├── locals.scm              # 局部变量/作用域查询
│   ├── tags.scm                # 标签查询
│   ├── textobjects.scm         # 文本对象查询
│   └── tests/                  # SCM 查询测试
├── builder/                    # 一键构建发布工具包（python -m builder）
├── bindings/                   # 多语言绑定（含各语言构建配置）
│   ├── c/                      # C 绑定（CMakeLists.txt、Makefile）
│   ├── go/                     # Go 绑定
│   ├── node/                   # Node.js 绑定（binding.gyp）
│   ├── python/                 # Python 绑定（pyproject.toml、setup.py）
│   ├── rust/                   # Rust 绑定（Cargo.toml）
│   └── swift/                  # Swift 绑定（Package.swift）
├── examples/                   # 使用示例项目
│   ├── sample.cj               # 共用的仓颉示例源文件
│   ├── python/                 # Python 示例
│   ├── node/                   # Node.js 示例
│   ├── c/                      # C 示例
│   ├── go/                     # Go 示例
│   └── rust/                   # Rust 示例
├── tests/                      # 测试套件
│   ├── test.js                 # Node.js 测试脚本
│   ├── test_corpus.js          # corpus 基线测试脚本
│   ├── corpus/                 # corpus 基线测试用例
│   └── testcase/               # 仓颉测试文件与示例项目（递归扫描）
```
