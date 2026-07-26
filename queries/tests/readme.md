# SCM 查询测试

本目录包含 tree-sitter-cangjie 的 SCM 查询文件（`highlights.scm`、`indents.scm`、`locals.scm`、`tags.scm`、`textobjects.scm`）的自动化测试。

## 目录结构

```
queries/tests/
├── readme.md            # 本文档
├── testcase/            # 仓颉测试源文件（已通过 cjc 编译验证）
│   ├── test_highlights.cj
│   ├── test_indents.cj
│   ├── test_locals.cj
│   ├── test_tags.cj
│   └── test_textobjects.cj
├── python/              # Python 测试脚本
│   ├── helpers.py
│   ├── run_all.py
│   ├── test_compilation.py
│   ├── test_highlights.py
│   ├── test_indents.py
│   ├── test_locals.py
│   ├── test_tags.py
│   └── test_textobjects.py
└── node/                # Node.js 测试脚本
    ├── helpers.js
    ├── run_all.js
    ├── test_compilation.js
    ├── test_highlights.js
    ├── test_indents.js
    ├── test_locals.js
    ├── test_tags.js
    └── test_textobjects.js
```

## 测试内容

### testcase/ — 仓颉测试源文件

每个 `.cj` 文件针对一种 SCM 查询文件设计，覆盖尽可能多的语法特性：

| 文件 | 测试目标 | 覆盖的主要特性 |
|------|---------|---------------|
| `test_highlights.cj` | highlights.scm | 所有关键字、运算符、字面量（整数/浮点/字符串/字符/布尔）、内置类型、注释、修饰符、标点符号 |
| `test_indents.cj` | indents.scm | 类/结构体/接口/枚举/扩展体缩进、函数块、控制流（if/match/for/while/do-while/try）、Lambda、数组、嵌套结构 |
| `test_locals.cj` | locals.scm | 作用域（translationUnit/class/struct/interface/enum/extend/function/main/block/lambda/for/while/if/match/try/init/property）、变量定义（let/var/元组解构/参数/Lambda 参数/for-in/match/catch/泛型类型参数）、引用 |
| `test_tags.cj` | tags.scm | 类/结构体/接口/枚举/函数/类型别名/属性定义标签，扩展中的方法，多方法类 |
| `test_textobjects.cj` | textobjects.scm | 类/函数/循环/条件/注释/参数文本对象的 inside/around 捕获，嵌套循环与条件 |

所有测试文件已通过仓颉编译器 (`cjc 1.0.5`) 验证语法正确性。

### python/ — Python 测试

每个 `test_*.py` 文件对应一种 SCM 文件的测试，可独立运行：

| 脚本 | 测试内容 |
|------|---------|
| `test_compilation.py` | 验证所有 5 个 SCM 文件能正确编译 |
| `test_highlights.py` | 验证语法高亮捕获（字面量、类型、关键字、运算符、标点等） |
| `test_indents.py` | 验证缩进规则捕获（indent.begin/end/auto/branch） |
| `test_locals.py` | 验证作用域、定义和引用捕获 |
| `test_tags.py` | 验证定义标签捕获 |
| `test_textobjects.py` | 验证文本对象捕获 |

### node/ — Node.js 测试

功能与 Python 版完全一致，使用 Node.js 内置 `node:test` 框架：

| 脚本 | 测试内容 |
|------|---------|
| `test_compilation.js` | 验证所有 5 个 SCM 文件能正确编译 |
| `test_highlights.js` | 验证语法高亮捕获 |
| `test_indents.js` | 验证缩进规则捕获 |
| `test_locals.js` | 验证作用域、定义和引用捕获 |
| `test_tags.js` | 验证定义标签捕获 |
| `test_textobjects.js` | 验证文本对象捕获 |

## 运行方法

### 前置条件

```bash
cd tree-sitter-cangjie

# Python 依赖
pip install tree-sitter
pip install -e .

# Node.js 依赖（需要 Node.js <= 22）
npm install
npm run build
```

### Python 测试

```bash
cd tree-sitter-cangjie

# 运行全部测试
python queries/tests/python/run_all.py

# 运行单个 SCM 文件的测试
python queries/tests/python/test_highlights.py
python queries/tests/python/test_indents.py
python queries/tests/python/test_locals.py
python queries/tests/python/test_tags.py
python queries/tests/python/test_textobjects.py
python queries/tests/python/test_compilation.py
```

### Node.js 测试

```bash
cd tree-sitter-cangjie

# 运行全部测试
node --test queries/tests/node/run_all.js

# 运行单个 SCM 文件的测试
node --test queries/tests/node/test_highlights.js
node --test queries/tests/node/test_indents.js
node --test queries/tests/node/test_locals.js
node --test queries/tests/node/test_tags.js
node --test queries/tests/node/test_textobjects.js
node --test queries/tests/node/test_compilation.js
```

### 仓颉编译器验证

使用 [仓颉 SDK](https://github.com/SunriseSummer/CangjieSDK/releases) 验证测试文件语法正确性：

```bash
source /path/to/cangjie/envsetup.sh

# 编译所有测试文件
for f in queries/tests/testcase/*.cj; do
    cjc "$f" -o /tmp/$(basename "$f" .cj)
done
```

## 技术说明

- **tree-sitter Query API**：Python 使用 `Query` + `QueryCursor` 类，Node.js 使用 `Parser.Query` 的 `matches()`/`captures()` 方法
- **语法限制**：`true`/`false` 被语法解析为标识符（`atomicVariable > varBindingPattern`），而非 `booleanLiteral` 节点
- **内置类型匹配**：`highlights.scm` 中的匿名 token 匹配（如 `"Int64" @type.builtin`）在编辑器高亮引擎中有效，但通过 `QueryCursor` 可能不产生捕获结果
- **Node.js 版本**：tree-sitter 0.25 需要 Node.js <= 22
