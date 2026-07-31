# Test layout

The repository root owns tests that cross project boundaries:

- `node/parser.test.js` parses real Cangjie projects and compares every `.cj`
  file with its committed `.ast` snapshot.
- `node/corpus.test.js` loads the standard corpus through the published-style
  Node binding.
- `node/queries/` compiles and exercises every query in `parser/queries`.
- `python/` mirrors the Node suite through the installed Python binding:
  project snapshots, corpus cases, incremental parsing, and all queries.
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

`npm test` runs all Node and WASM suites in dependency order. Python tests
require an installed wheel (a local build or the published package):

```shell
npm run test:python
```

Both binding suites parse the same project sources, compare against the same
`.ast` snapshots, execute every standard corpus case with and without a
trailing newline, exercise incremental reparsing, and run equivalent query
assertions against `fixtures/queries/`. Binding-specific checks additionally
verify that each distribution contains current parser metadata and query
resources.

## Maintain fixtures

After an intentional grammar change, inspect the parser output before updating
baselines:

```shell
npm run snapshots:update
npm run corpus:update
```

Do not accept bulk snapshot changes without reviewing unexpected `ERROR` or
`MISSING` nodes. Repository tests are intentionally not copied into release
artifacts: CI installs each built wheel or sdist into an isolated environment,
then runs `tests/python` from the checkout against that installed distribution.
