"""Versioned syntax, AST invariants, and incremental parsing via installed wheel."""
import json
from pathlib import Path
import pytest
from tree_sitter import Language, Parser
import tree_sitter_cangjie

ROOT = Path(__file__).resolve().parents[2]
METADATA = json.loads((ROOT / 'language-version.json').read_text(encoding="utf-8"))
CASES = [case for file in METADATA['fixtures'] for case in
         json.loads((ROOT / 'tests/fixtures/versions' / file).read_text(encoding="utf-8"))]
LANGUAGE = Language(tree_sitter_cangjie.language())


def nodes(root):
    yield root
    for child in root.children:
        yield from nodes(child)


@pytest.mark.parametrize('entry', CASES, ids=lambda c: c['name'])
@pytest.mark.parametrize('ending', ['LF', 'CRLF', 'EOF'])
def test_version_source(entry, ending):
    source = entry['source']
    if ending == 'CRLF':
        source = source.replace('\n', '\r\n')
    elif ending == 'EOF':
        source = source.rstrip()
    tree = Parser(LANGUAGE).parse(source.encode())
    assert not tree.root_node.has_error, str(tree.root_node)
    all_nodes = list(nodes(tree.root_node))
    assert not any(n.is_missing for n in all_nodes)
    for kind, count in entry['nodes'].items():
        assert sum(n.is_named and n.type == kind for n in all_nodes) == count, kind


@pytest.mark.parametrize('entry', CASES, ids=lambda c: c['name'])
def test_incremental_unicode_and_undo(entry):
    # Python uses UTF-8 byte offsets; exercise multibyte content independently
    # of the UTF-16 Node binding's edits.
    source = entry['source'].encode()
    insertion = '/* 中文 /* nested */ */\n'.encode()
    tree = Parser(LANGUAGE).parse(source)
    tree.edit(0, 0, len(insertion), (0, 0), (0, 0), (1, 0))
    changed = insertion + source
    updated = Parser(LANGUAGE).parse(changed, tree)
    assert str(updated.root_node) == str(Parser(LANGUAGE).parse(changed).root_node)
    updated.edit(0, len(insertion), 0, (0, 0), (1, 0), (0, 0))
    restored = Parser(LANGUAGE).parse(source, updated)
    assert str(restored.root_node) == str(Parser(LANGUAGE).parse(source).root_node)


def test_error_recovery():
    tree = Parser(LANGUAGE).parse(b'func broken(x: ) {}\nfunc recovered(): Int64 {42}\n')
    assert tree.root_node.has_error
    assert any(n.type == 'funcName' and n.text == b'recovered' for n in nodes(tree.root_node))
