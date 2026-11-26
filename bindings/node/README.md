# tree-sitter-cangjie

Node.js binding for the Cangjie Tree-sitter grammar.

```shell
npm install tree-sitter tree-sitter-cangjie
```

```javascript
const Parser = require("tree-sitter");
const Cangjie = require("tree-sitter-cangjie");

const parser = new Parser();
parser.setLanguage(Cangjie);
const tree = parser.parse("package demo\nmain() {}\n");
console.log(tree.rootNode.toString());
```

The package includes native prebuilds for Linux, Windows, and macOS on x64
and ARM64, the generated C parser for source fallback builds, Tree-sitter
queries, and `tree-sitter-cangjie.wasm`.

Grammar development sources are maintained in the repository's `parser`
project and are staged into this self-contained package before publication.

This branch targets Cangjie 1.2.1. Install `tree-sitter-cangjie@1.2.1` (npm)
or `tree-sitter-cangjie==1.2.1` (PyPI) for a reproducible language baseline.
