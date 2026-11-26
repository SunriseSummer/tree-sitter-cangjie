# Changelog

All notable changes to this project are documented in this file.

## [1.3.0-alpha.20261126001016] - 2026-11-26

- Track Cangjie nightly 1.3.0-alpha.20261126001016, compiler c7a8aac534cd;
  this is explicitly a prerelease, published under npm tag next.
- Parse experimental modal types (@ local!, @ local?, @ ~local), modal
  constructor calls and nested functions, this-mode parameters, demode fields,
  and exclave modifiers/expressions. Keep local/exclave/demode identifiers
  usable in ordinary code and preserve all 1.0.x and 1.2.1 fixture ASTs.
- Distinguish a function return's mode from the mode of a grouped function type.
- Add official-SDK executable regressions for Option trailing lambdas,
  primitive aliases, sealed exhaustive matches, Extern generic signatures,
  structured concurrency, and the documented local-mode constructs.
- Correct UTF-8 fixture handling on Windows in both language branches.

## [1.2.1] - 2026-11-26

- Adapt to the official Cangjie 1.2.1 SDK: organization-qualified packages and
  imports, common/specific declarations and extensions, open common enums,
  features directives, and @! interop annotations.
- Parse experimental effect handlers (perform, resume, handle), including
  nested handlers and catch/finally clauses on separate lines.
- Preserve existing 1.0.x fixture ASTs, and add shared version tests for Node,
  Python and WASM, incremental edits, line endings, and compiler validation.
- Publish the new language line independently from cangjie-1.0.5.

## [1.0.5-post1] - 2026-07-31

- Refresh the Python package documentation published on PyPI.
- Separate complete GitHub Release creation from npm and PyPI publication,
  with one-pass and registry-selective publishing operations.

## [1.0.5] - 2026-07-29

- Publish the Cangjie 1.0.5 grammar as a Node.js native addon for Linux,
  Windows, and macOS on x64 and ARM64.
- Publish CPython 3.10+ stable-ABI wheels and a Python source distribution to
  both PyPI and GitHub Releases.
- Keep the complete Python packaging project under `bindings/python`, with
  automatically staged parser sources for self-contained source distributions.
- Split grammar development into the private `parser` Node.js project and npm
  packaging into the independent `bindings/node` project.
- Add a private root Node.js orchestration project, with repository-level
  integration tests and fixtures separated from the standard parser corpus.
- Provide a WebAssembly grammar for use with `web-tree-sitter`.
- Regenerate the parser with tree-sitter CLI 0.26.11, refreshing the generated
  runtime support and Unicode identifier tables.
- Add package-level installation tests, parser regression tests, checksums,
  and GitHub build provenance attestations.
