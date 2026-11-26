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

This branch targets Cangjie 1.2.1. Install `tree-sitter-cangjie@1.2.1` (npm)
or `tree-sitter-cangjie==1.2.1` (PyPI) for a reproducible language baseline.
