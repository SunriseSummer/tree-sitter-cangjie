"""End-to-end parser and Python binding tests using shared fixtures."""

from importlib.resources import files
from pathlib import Path

import pytest
from tree_sitter import Language, Parser
import tree_sitter_cangjie


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
PROJECT_FIXTURES_DIR = REPOSITORY_ROOT / "tests" / "fixtures" / "projects"
QUERIES_DIR = REPOSITORY_ROOT / "parser" / "queries"
QUERY_NAMES = (
    "highlights.scm",
    "indents.scm",
    "locals.scm",
    "tags.scm",
    "textobjects.scm",
)
LANGUAGE = Language(tree_sitter_cangjie.language())
PROJECT_CASES = tuple(sorted(PROJECT_FIXTURES_DIR.rglob("*.cj")))


def new_parser():
    """Create a parser backed by the installed Python binding."""
    return Parser(LANGUAGE)


def nodes_of_type(root, node_type):
    """Return all nodes of a given type in source order."""
    matches = []
    stack = [root]
    while stack:
        node = stack.pop()
        if node.type == node_type:
            matches.append(node)
        stack.extend(reversed(node.children))
    return matches


def assert_complete_tree(root, label):
    """Reject syntax errors even if an AST snapshot accidentally records one."""
    problems = []
    stack = [root]
    while stack:
        node = stack.pop()
        if node.type == "ERROR" or node.is_missing:
            problems.append(
                f"{node.type}{' (MISSING)' if node.is_missing else ''} at "
                f"{node.start_point.row + 1}:{node.start_point.column + 1}"
            )
        stack.extend(reversed(node.children))

    assert not root.has_error, f"[{label}] parse tree reports a syntax error"
    assert not problems, (
        f"[{label}] parse tree contains recovery nodes:\n"
        + "\n".join(problems)
    )


def test_can_load_grammar():
    parser = new_parser()
    assert parser.language == LANGUAGE


def test_can_parse_empty_source():
    parser = new_parser()
    tree = parser.parse(b"")

    assert tree.root_node.type == "translationUnit"
    assert not tree.root_node.has_error


def test_python_package_exports_current_query_constants():
    constants = {
        "highlights.scm": tree_sitter_cangjie.HIGHLIGHTS_QUERY,
        "locals.scm": tree_sitter_cangjie.LOCALS_QUERY,
        "tags.scm": tree_sitter_cangjie.TAGS_QUERY,
    }

    for query_name, packaged in constants.items():
        repository = (QUERIES_DIR / query_name).read_text(encoding="utf-8")
        assert packaged == repository, f"packaged {query_name} constant is stale"


def test_python_package_contains_all_repository_queries():
    packaged_queries = files("tree_sitter_cangjie.queries")

    for query_name in QUERY_NAMES:
        packaged = (packaged_queries / query_name).read_text(encoding="utf-8")
        repository = (QUERIES_DIR / query_name).read_text(encoding="utf-8")
        assert packaged == repository, f"packaged {query_name} is stale"


def test_true_and_false_are_boolean_literal_nodes():
    tree = new_parser().parse(
        b"main() { let yes = true; let no = false }\n"
    )
    assert_complete_tree(tree.root_node, "boolean literals")

    booleans = [
        node.text.decode("utf-8")
        for node in nodes_of_type(tree.root_node, "booleanLiteral")
    ]
    bindings = [
        node.text.decode("utf-8")
        for node in nodes_of_type(tree.root_node, "varBindingPattern")
    ]
    assert booleans == ["true", "false"]
    assert "true" not in bindings
    assert "false" not in bindings


def test_enum_constructors_keep_names_and_optional_payloads_together():
    tree = new_parser().parse(
        b"enum Result<T> { None | Ok(T) | Err(Int64, String) }\n"
    )
    assert_complete_tree(tree.root_node, "enum constructors")
    constructors = nodes_of_type(tree.root_node, "enumConstructor")

    names = [
        node.child_by_field_name("name").text.decode("utf-8")
        for node in constructors
    ]
    payloads = [
        (
            payload.text.decode("utf-8")
            if (payload := node.child_by_field_name("payload"))
            else None
        )
        for node in constructors
    ]
    assert names == ["None", "Ok", "Err"]
    assert payloads == [None, "(T)", "(Int64, String)"]


@pytest.mark.parametrize(
    "fixture_path",
    PROJECT_CASES,
    ids=lambda path: path.relative_to(PROJECT_FIXTURES_DIR).as_posix(),
)
def test_project_fixture_matches_ast_snapshot(fixture_path):
    label = fixture_path.relative_to(PROJECT_FIXTURES_DIR).as_posix()
    tree = new_parser().parse(fixture_path.read_bytes())
    assert_complete_tree(tree.root_node, label)

    snapshot_path = fixture_path.with_suffix(".ast")
    assert snapshot_path.is_file(), (
        f"[{label}] snapshot not found: {snapshot_path}\n"
        "Run 'npm run snapshots:update' from the repository root."
    )
    assert str(tree.root_node) == snapshot_path.read_text(
        encoding="utf-8"
    ).strip()


NEWLINE_CASES = (
    ("package only", "package test\n"),
    ("macro package", "macro package mymacros\n"),
    ("import", "import std.io\n"),
    ("multiple imports", "import std.io\nimport std.collection\n"),
    ("package + import", "package test\nimport std.io\n"),
    (
        "package + import + class",
        "package test\nimport std.io\nclass Foo {}\n",
    ),
    ("class only", "class Foo {}\n"),
    ("main function", "main() {\n    return 0\n}\n"),
    ("variable declaration", "let x = 42\n"),
    (
        "full program",
        "package test\nimport std.io\nmain() {\n    let x = 1\n}\n",
    ),
)


@pytest.mark.parametrize(
    "label,source",
    NEWLINE_CASES,
    ids=[label for label, _ in NEWLINE_CASES],
)
def test_trailing_newline_does_not_change_ast(label, source):
    parser = new_parser()
    with_newline = parser.parse(source.encode("utf-8"))
    without_newline = parser.parse(source.rstrip("\n").encode("utf-8"))

    assert_complete_tree(with_newline.root_node, f"{label}, with newline")
    assert_complete_tree(without_newline.root_node, f"{label}, no newline")
    assert str(with_newline.root_node) == str(without_newline.root_node)


def test_incremental_edit_reuses_tree_and_reports_changed_range():
    parser = new_parser()
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

    assert_complete_tree(new_tree.root_node, "incremental edit")
    assert [
        node.text.decode("utf-8")
        for node in nodes_of_type(new_tree.root_node, "booleanLiteral")
    ] == ["true"]
    assert tree.changed_ranges(new_tree)
