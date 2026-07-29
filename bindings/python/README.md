# tree-sitter-cangjie Python binding

This directory contains the Python packaging entry point and native bridge for
the Cangjie tree-sitter grammar.

The wheel depends on the `tree-sitter` Python package at runtime. Release
wheels and source distributions are published to PyPI and through the
repository's GitHub Releases page.

From the repository root, build both distributions with:

```shell
python -m build bindings/python
```

The local PEP 517 backend stages the generated parser and queries from
`../../parser`, shared query fixtures from `../../tests/fixtures/queries`, and
the repository license under an ignored `vendor/` directory for the duration
of the build.
This keeps the source distribution self-contained without committing duplicate
parser sources.
