# Parser development project

This private Node.js project owns the Cangjie grammar, generated C parser,
queries, and the standard Tree-sitter corpus at `test/corpus`.

```shell
npm ci
npm run generate
npm test
```

The project intentionally contains only Tree-sitter CLI responsibilities.
Repository-level integration tests, fixtures, snapshots, and WebAssembly
scripts live at the repository root. From there, use:

```shell
npm run generate
npm run test:parser
npm run build:wasm
npm run test:wasm
```

`npm run generate` must leave the Git worktree unchanged. The public Node.js
package is an independent project in `../bindings/node`; its staging script
copies the generated parser and runtime assets into the publishable package.

This branch targets the experimental Cangjie `1.3.0-alpha.20261126001016` nightly.
Install `tree-sitter-cangjie@1.3.0-alpha.20261126001016` from npm (`next` tag),
or `tree-sitter-cangjie==1.3.0a20261126001016` from PyPI.
This is not a final Cangjie 1.3.0 release. Local-mode compilation requires
`--experimental --enable-local-mode`; the grammar recognizes its syntax directly.
