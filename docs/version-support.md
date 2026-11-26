# Cangjie 1.2.1 support

This branch targets the official **1.2.1 STS** SDK, verified by SHA-256 in
`language-version.json`. Package versions are 1.2.1 on both npm and PyPI.
The original 1.0.x branch and its releases remain independent.

## Syntax coverage

| Area | Grammar / regression coverage |
| --- | --- |
| Packages | `org::package`, subpackages, macro packages, single/star/group/alias imports |
| Multiplatform | common/specific functions, classes, structs, interfaces, properties, constructors, type aliases, extensions, enum ellipsis |
| Compiler features | file-level features sets, dotted feature IDs, empty sets |
| Interop | @! annotations, foreign blocks/classes, C annotations and pointers |
| Effects (experimental) | perform, resume/with/throwing, handle, nested/multiple handlers, mixed catch/finally, newline/comment continuation |
| Existing language | generics, constraints, patterns/guards, properties/operators, optional chains, collections, spawn, quotes/splices, Unicode, nested comments, raw/multiline strings |

The parser recognizes syntax; compiler flags, type checking, API availability,
initialization safety and foreign-platform linking remain compiler concerns.
Semantic changes such as std.env APIs or static-initialization diagnostics do
not require new AST syntax. Experimental constructs are accepted in the same
grammar; this does not implicitly enable them in cjc.

## Evidence and reproducible checks

- [Official 1.2.1 package syntax](https://cj-docs.gitcode.com/zh/1.2.1/dev-guide/source_zh_cn/package/package_name.html)
- [Official 1.2.1 multiplatform guide](https://cj-docs.gitcode.com/zh/1.2.1/dev-guide/source_zh_cn/multiplatform/common_platform.html)
- [Official compiler parser, release/1.2](https://gitcode.com/Cangjie/cangjie_compiler/tree/release/1.2/src/Parse)
- SDK SHA-256: `5616624fcb48db150df2accde6669a2c8cc5e851d79e623a5469c4e4cd7a491f`.
- stdx 1.2.1.1 SHA-256: `21464b7a53ebf22f8f6a00d6f5837a11c177f35f37cecb9b5422e49b3237c89b`.

`tests/fixtures/versions/1.2.1.json` contains 24 scenarios with explicit AST-node
invariants. Node and Python run LF, CRLF, EOF and incremental edit/undo checks;
WASM runs the same syntax/node invariants. The original project snapshots must
remain unchanged. Standard corpus cases additionally pin the new AST shapes.

`docs/compiler-validation.json` records 14 successful official-compiler builds,
including macro libraries and 11 executed programs with checked output. Effects
are built using `--experimental --enable-eh` and the official stdx.effect library.
Platform-specific interop snippets and declarations that require a paired
common/specific project are parser tests, not claimed as host-linkable programs.

```sh
npm ci
npm run bootstrap
npm run build
npm test
CC=gcc CXX=g++ python -m build bindings/python
python -m pip install bindings/python/dist/*.whl
npm run test:python
python scripts/verify-compiler.py --sdk /path/to/cangjie --stdx /path/to/stdx
npm run verify:release
```

Python wheels and npm tarballs are also installed outside the source tree in
the release workflow. The source distribution is rebuilt independently. The
release workflow builds native addons for six OS/architecture targets and
Python wheels for Linux (glibc/musl), Windows and macOS. No old-version binary
is reused for the new grammar.
