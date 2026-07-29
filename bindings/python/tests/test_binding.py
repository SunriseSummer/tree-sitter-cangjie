import tree_sitter
import tree_sitter_cangjie


def test_can_load_and_parse_cangjie():
    language = tree_sitter.Language(tree_sitter_cangjie.language())
    parser = tree_sitter.Parser(language)
    tree = parser.parse(
        b'package release_test\nmain() { println("Hello, Cangjie!") }\n'
    )

    assert tree.root_node.type == "translationUnit"
    assert not tree.root_node.has_error


def test_queries_are_packaged():
    assert "(identifier)" in tree_sitter_cangjie.HIGHLIGHTS_QUERY
    assert tree_sitter_cangjie.LOCALS_QUERY
    assert tree_sitter_cangjie.TAGS_QUERY
