# Test layout

The repository root owns tests that cross project boundaries:

- `node/parser.test.js` parses real Cangjie projects and compares every `.cj`
  file with its committed `.ast` snapshot.
- `node/corpus.test.js` loads the standard corpus through the published-style
  Node binding.
- `node/queries/` compiles and exercises every query in `parser/queries`.
- `fixtures/projects/` contains real projects, focused language samples, and
  their AST snapshots.
- `fixtures/queries/` contains focused source files for query assertions shared
  by the Node and Python suites.

The one deliberate exception is `parser/test/corpus`. `tree-sitter test`
discovers this conventional path directly, so it belongs to the parser
development project rather than the repository integration suite.

## Run the suites

Install all independent Node projects from the repository root:

```shell
npm ci
npm run bootstrap
```

Then run:

```shell
npm run test:parser
npm run test:node
npm run build:wasm
npm run test:wasm
```

`npm test` runs all of those suites in dependency order. Python tests require
a locally built and installed wheel:

```shell
python -m pytest bindings/python/tests
```

## Maintain fixtures

After an intentional grammar change, inspect the parser output before updating
baselines:

```shell
npm run snapshots:update
npm run corpus:update
```

Do not accept bulk snapshot changes without reviewing unexpected `ERROR` or
`MISSING` nodes. Query fixtures are shared with the Python sdist: the PEP 517
backend stages them under `bindings/python/vendor/tests/queries` while building,
so source-distribution tests remain independent of the repository checkout.
