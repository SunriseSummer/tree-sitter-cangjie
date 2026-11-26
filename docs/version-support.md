# Cangjie 1.3 nightly support

This branch targets **1.3.0-alpha.20261126001016**, not a final 1.3.0 release.
The exact compiler is `c7a8aac534cd8df8c9c0898c6cc620be4a1ef35a`; bundled HTML
manual commit `0985bf011f29` is the syntax reference for experimental local mode.
SDK, documentation and stdx archive digests were checked against official release
metadata before testing. `language-version.json` pins the SDK and stdx downloads.

| Distribution | Version / channel |
| --- | --- |
| Git branch | cangjie-1.3.0 |
| npm | 1.3.0-alpha.20261126001016, tag next |
| PyPI (PEP 440) | 1.3.0a20261126001016 |
| Stable 1.2.1 | Independent branch and registry version 1.2.1 |

The official nightly archive is retained for a limited period. The parser and
compiled distributions are self-contained; installing them never downloads a
Cangjie SDK. To rerun compiler checks later, use the exact pinned SDK/stdx from
a local archive if the upstream nightly download has expired.

## Syntax changes and coverage

| Area | Tests / AST behavior |
| --- | --- |
| Modal types | modalType(type, mode), @ local!, @ local?, @ ~local; function parameters/results, tuples, optionals, VArray and grouped function types |
| Constructor modes | postfixExpression with a mode suffix; compact @local!= initializer and newline after @ |
| Receiver modes | thisParameter nodes in function/constructor parameterList |
| Local allocation | exclaveExpression and exclave/demode modifiers; local constructors, caller regions, demode members, Copyable constraints |
| Nested functions | a mode directly before func, distinguished from a macro expression |
| Contextual names | local, exclave and demode remain usable as identifiers in ordinary source |
| Option trailing lambdas | ordinary trailingLambdaExpression syntax, tested with Option<Option<function>> |
| Alias conversions | existing typeAlias and call nodes; checked against numeric/rune aliases |
| Sealed matching | existing typePattern/matchCase syntax; nightly exhaustive matching checked by cjc |
| Foreign runtimes | existing generic/call/member/index syntax for Extern<R> |
| Structured concurrency | std.concurrent threadScope/launch scenarios with output verification |
| Earlier syntax | all 1.2.1 cases and original 1.0.x project AST snapshots preserved |

A function type `() -> String @ local?` returns a modal String. The mode in
`(() -> String) @ local?` instead annotates the function object. Both Node and
Python assert this tree relationship explicitly, not only the number of nodes.
The mode specifier itself is a single token, so `local !` and `~ local` are
rejected. The @ token may be separated from that specifier by whitespace.

This is a syntax parser, accepting normal and experimental syntax together. It
does not check mode escape safety, Copyable eligibility, platform imports,
sealed-match exhaustiveness or availability of specific APIs. Those are checked
by the official compiler; local-mode programs require
`--experimental --enable-local-mode`, effects require `--experimental --enable-eh`.

## Verification

Local checks on Linux x64: Node 531/531, Python 525/525, corpus 81/81,
WASM 42/42, official compiler 30/30 (25 executed with checked output).

42 shared scenarios (24 inherited + 18 nightly) run through Node, Python and
WASM. Node/Python additionally exercise LF, CRLF, EOF and incremental edits.
Standard Tree-sitter corpus contains 81 scenarios with pinned ASTs. Existing
project AST snapshots remain unchanged. Broken declarations and raw-string
edits verify recovery. UTF-8 is explicit in Python file reads on Windows.

`docs/compiler-validation.json` records **30 official nightly builds**, of
which **25 executables** ran with exact expected output. It covers effects using
the matching stdx.effect library and local mode using the documented flags.
Platform-specific interop snippets and Extern runtime implementations are parser
scenarios; only the generic Extern payload signature is compiled. The previous
stable compiler report is retained in `compiler-validation-1.2.1.json`.

```sh
npm ci
npm run bootstrap
npm run build
npm test
CC=gcc CXX=g++ python -m build bindings/python
python -m pip install bindings/python/dist/*1.3.0a*.whl
npm run test:python
python scripts/verify-compiler.py --sdk /path/to/cangjie --stdx /path/to/stdx
npm run verify:release
```

The release workflow builds and tests six native Node OS/architecture targets,
eight Python wheels (including glibc/musl), the source distribution and WASM.
Its checksummed GitHub Release artifacts are the exact files published to npm
and PyPI. Prerelease normalization is shared by validation and release metadata;
npm next does not move the stable latest tag.

## Official references

- [Pinned nightly release](https://gitcode.com/Cangjie/nightly_build/releases/tag/1.3.0-alpha.20261126001016)
- [Compiler at the tested commit](https://gitcode.com/Cangjie/cangjie_compiler/tree/c7a8aac534cd8df8c9c0898c6cc620be4a1ef35a/src/Parse)
- Bundled HTML: dev-guide/source_zh_cn/modal_type/{modal_overview,local_mode_rules,exclave,copyable_and_demode}.html
- Bundled HTML: dev-guide/source_zh_cn/function/function_call_desugar.html
- Bundled HTML: dev-guide/source_zh_cn/generic/typealias.html
- Bundled HTML: libs/std/core/core_package_api/core_package_structs.html (Extern)
- [Inherited 1.2.1 package syntax](https://cj-docs.gitcode.com/zh/1.2.1/dev-guide/source_zh_cn/package/package_name.html)
- [Inherited multiplatform syntax](https://cj-docs.gitcode.com/zh/1.2.1/dev-guide/source_zh_cn/multiplatform/common_platform.html)
