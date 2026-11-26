# tree-sitter-cangjie

Node.js binding for the Cangjie Tree-sitter grammar.

```shell
npm install tree-sitter tree-sitter-cangjie@1.3.0-alpha.20261126001016
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

This branch targets the experimental Cangjie `1.3.0-alpha.20261126001016` nightly.
Install `tree-sitter-cangjie@1.3.0-alpha.20261126001016` from npm (`next` tag),
or `tree-sitter-cangjie==1.3.0a20261126001016` from PyPI.
This is not a final Cangjie 1.3.0 release. Local-mode compilation requires
`--experimental --enable-local-mode`; the grammar recognizes its syntax directly.
