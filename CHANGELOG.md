# Changelog

All notable changes to this project are documented in this file.

## [1.0.5] - 2026-07-29

- Publish the Cangjie 1.0.5 grammar as a Node.js native addon for Linux,
  Windows, and macOS on x64 and ARM64.
- Provide CPython 3.10+ stable-ABI wheels and a Python source distribution in
  GitHub Releases.
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
