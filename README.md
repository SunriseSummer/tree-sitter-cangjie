# Tree-Sitter-Cangjie

`tree-sitter-cangjie` 是适配[仓颉编程语言](https://cangjie-lang.cn/)（Cangjie 1.0.5）的 Tree-sitter 语法解析器。
仓库维护并发布三类产物：

- Node.js 原生插件：发布到 npm 和 GitHub Releases。
- Python 原生插件：发布到 PyPI 和 GitHub Releases。
- WebAssembly 模块：包含在 npm 包中，同时发布到 GitHub Releases。

## 工程结构

```text
tree-sitter-cangjie/
├── package.json                 # 根工程：统一构建、测试和发布校验入口
├── scripts/                     # 仓库级 WASM、快照和发布脚本
├── tests/
│   ├── node/                    # 基于 parser/binding/node 的端到端测试
│   ├── python/                  # 与 node 对称的 python 端到端测试
│   └── fixtures/                # 各类仓颉项目、AST 快照和 query 测试数据
├── parser/                      # 仓颉语法及解析器
│   ├── grammar/                 # 仓颉语法定义
│   ├── src/                     # 基于 grammar 描述生成的 C 解析器和节点元数据
│   ├── queries/                 # 各类查询定义：highlights/indents/locals/tags/textobjects
│   ├── test/corpus/             # tree-sitter CLI 标准 corpus
│   ├── package.json
│   └── tree-sitter.json
├── bindings/
│   ├── node/                    # 独立 npm 发布工程和 N-API 桥接
│   └── python/                  # 独立 Python 发布工程和 CPython 桥接
└── .github/workflows/           # CI 与手动发布流水线
```

根工程只负责调度和集成测试，设置了 `private: true`，不会发布到 npm 中心仓。
`parser`、`bindings/node` 各自拥有独立的 `package.json`，仓库不使用
npm workspaces，避免发布包的依赖和根工程工具依赖互相污染。

Node 发布工程会在构建和打包时，把 `parser` 中的语法定义、C 源码、queries、
元数据和 WASM 暂存到自身目录。Python 工程通过本地 PEP 517 后端做同类暂存。
这些目录均受 `.gitignore` 管理，最终 npm tarball、wheel 和 sdist 都是自包含的。

## 安装和使用

### Node.js

```shell
npm install tree-sitter tree-sitter-cangjie
```

```javascript
const Parser = require("tree-sitter");
const Cangjie = require("tree-sitter-cangjie");

const parser = new Parser();
parser.setLanguage(Cangjie);
const tree = parser.parse('main() { println("Hello, Cangjie!") }\n');
console.log(tree.rootNode.toString());
```

npm 包提供 Linux、Windows、macOS 的 x64 和 ARM64 预构建插件。其他平台会尝试
通过 `node-gyp` 使用包内的 C 源码回退构建。

### Python

```shell
pip install tree-sitter tree-sitter-cangjie
```

```python
from tree_sitter import Language, Parser
import tree_sitter_cangjie

language = Language(tree_sitter_cangjie.language())
parser = Parser(language)
tree = parser.parse(b'main() { println("Hello, Cangjie!") }\n')
print(tree.root_node)
```

Python wheel 和 sdist 同时发布到 PyPI 与 GitHub Releases。
wheel 使用 CPython 3.11 构建，并限制为 CPython 3.10 stable ABI，因此文件标记为
`cp310-abi3`，支持标准 GIL 构建的 CPython 3.10 及以上版本。

### WebAssembly

GitHub Release 和 npm 包都包含 `tree-sitter-cangjie.wasm`：

```javascript
const { Language, Parser } = require("web-tree-sitter");

await Parser.init();
const language = await Language.load("tree-sitter-cangjie.wasm");
const parser = new Parser();
parser.setLanguage(language);
const tree = parser.parse("main() {}\n");
```

## tree-sitter-cangjie 项目开发

推荐使用 Node.js 24 和 npm 11，在仓库根目录安装三个独立 Node 工程：

```shell
npm ci
npm run bootstrap
```

常用入口：

```shell
npm run generate          # 重新生成 parser/src
npm run build             # 生成 parser，并构建 Node 与 WASM
npm test                  # parser corpus、Node binding、集成测试、WASM
npm run test:node         # 实战项目 AST、corpus 镜像和 queries
npm run test:python       # 通过 Python binding 运行同一组 fixtures、corpus 和 queries
npm run snapshots:update  # 更新实战项目 AST 快照
npm run corpus:update     # 根据标准 corpus 更新测试基线
npm run verify:release    # 校验版本、目录边界和发布元数据
```

`npm run generate` 必须在提交内容完整时保持工作树无差异。WASM 构建还要求
Clang 带 WebAssembly 后端，并且系统中可用 `wasm-ld`。

Python 包的构建和测试是比较独立的，且测试前需要在环境中安装构建出的插件。

构建 Python 分发包：

```shell
python -m pip install build
npm run build:python
```

安装生成的 wheel 后，执行测试：

```shell
npm run test:python
```

详细测试布局和维护方式见 `tests/README.md`。

## 持续集成和发布

`.github/workflows/ci.yml` 会验证 parser 生成结果和 corpus、WASM、六个平台目标的
Node 原生插件，以及六个平台目标的 Python wheel。

`.github/workflows/release.yml` 由 `cangjie-1.0.5` 分支手动触发，不会回写或推送
源码。触发时通过 `operation` 选择操作：

- `onepass`：全量构建测试，创建完整 GitHub Release，然后发布 npm 和 PyPI。
- `release`：全量构建测试并创建完整 GitHub Release，不发布中心仓。
- `publish`：从已有 GitHub Release 下载并校验产物，发布 npm 和 PyPI。
- `publish_npm`：从已有 GitHub Release 只发布 npm。
- `publish_pypi`：从已有 GitHub Release 只发布 PyPI。

所有操作都必须人工填写 `release_version`（不带 `v`）。`onepass` 和 `release`
会校验该值与仓库中的 Node、Python 统一版本完全一致；三个 `publish*` 操作使用
它定位已有 GitHub Release，且不重新构建或测试。中心仓发布始终消费 GitHub
Release 中的原始产物并验证 `SHA256SUMS`，不会重新组装发布包。

Python 会按照 PEP 440 规范化发行版本。例如，仓库统一版本 `1.0.5-post1`
对应 GitHub/npm 产物版本 `1.0.5-post1`，Python wheel、sdist 和 PyPI 版本
则规范化显示为 `1.0.5.post1`。

npm 发布使用 Trusted Publisher 和 GitHub Actions OIDC，不使用长期 npm Token。
Trusted Publisher 配置如下：

- GitHub owner：`SunriseSummer`
- Repository：`tree-sitter-cangjie`
- Workflow：`release.yml`
- Environment：留空
- Allowed action：`npm publish`

PyPI 发布同样使用 Trusted Publisher 和 GitHub Actions OIDC，不需要密码、
API Token 或 GitHub Environment：

- PyPI project：`tree-sitter-cangjie`
- PyPI owner：`sunrisesummer`（个人账号）
- GitHub owner：`SunriseSummer`
- Repository：`tree-sitter-cangjie`
- Workflow：`release.yml`
- Environment：留空

## 许可证

本项目使用木兰宽松许可证第 2 版（MulanPSL-2.0），详见 `LICENSE`。
