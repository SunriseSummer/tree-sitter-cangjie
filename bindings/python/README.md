# tree-sitter-cangjie

Python bindings for the [Tree-sitter](https://tree-sitter.github.io/tree-sitter/)
Cangjie grammar. The package provides a native Cangjie parser plus the
highlights, indents, locals, tags, and textobjects queries maintained by the
`tree-sitter-cangjie` project.

The current grammar targets Cangjie 1.0.5.

## Installation

Install the binding together with the Python Tree-sitter runtime:

```shell
pip install "tree-sitter-cangjie[core]"
```

If `tree-sitter` is already managed separately in your application:

```shell
pip install tree-sitter-cangjie
```

Python 3.10 or newer is required. Prebuilt wheels are published for Linux,
Windows, and macOS on x64 and ARM64. A source distribution is also available
for other supported environments with a C compiler.

## Parse Cangjie source

```python
from tree_sitter import Language, Parser
import tree_sitter_cangjie

cangjie = Language(tree_sitter_cangjie.language())
parser = Parser(cangjie)

source = b'package demo\nmain() { println("Hello, Cangjie!") }\n'
tree = parser.parse(source)

print(tree.root_node)
assert not tree.root_node.has_error
```

Tree-sitter nodes expose byte ranges, source positions, named children, and
grammar field lookups:

```python
root = tree.root_node
for child in root.named_children:
    print(child.type, child.start_point, child.end_point)
```

## Run syntax queries

The binding exports the commonly consumed query texts as
`HIGHLIGHTS_QUERY`, `LOCALS_QUERY`, and `TAGS_QUERY`:

```python
from tree_sitter import Query, QueryCursor

query = Query(cangjie, tree_sitter_cangjie.TAGS_QUERY)
captures = QueryCursor(query).captures(tree.root_node)

for capture_name, nodes in captures.items():
    for node in nodes:
        text = source[node.start_byte:node.end_byte].decode("utf-8")
        print(capture_name, text)
```

All five `.scm` query files, including `indents.scm` and `textobjects.scm`,
are also installed in the `tree_sitter_cangjie.queries` package resources.

## Incremental parsing

After editing a previous tree, pass it back to `Parser.parse` so Tree-sitter
can reuse unchanged subtrees:

```python
old_source = b"main() { let value = 1 }\n"
new_source = b"main() { let value = true }\n"
tree = parser.parse(old_source)
start = old_source.index(b"1")

tree.edit(
    start_byte=start,
    old_end_byte=start + 1,
    new_end_byte=start + 4,
    start_point=(0, start),
    old_end_point=(0, start + 1),
    new_end_point=(0, start + 4),
)
new_tree = parser.parse(new_source, tree)
changed_ranges = tree.changed_ranges(new_tree)
```

## Project links

- [Source repository](https://github.com/SunriseSummer/tree-sitter-cangjie)
- [Issue tracker](https://github.com/SunriseSummer/tree-sitter-cangjie/issues)
- License: MulanPSL-2.0
