#!/usr/bin/env python3
"""
Shared utilities for tree-sitter-cangjie SCM query tests.

Provides helper functions for loading queries, parsing files,
and running query captures.
"""

from pathlib import Path

import tree_sitter_cangjie
from tree_sitter import Language, Parser, Query, QueryCursor

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
QUERIES_DIR = REPOSITORY_ROOT / "parser" / "queries"
TESTCASE_DIR = REPOSITORY_ROOT / "tests" / "fixtures" / "queries"


def get_parser_and_language():
    """Create a parser with the Cangjie language loaded."""
    lang = Language(tree_sitter_cangjie.language())
    parser = Parser(lang)
    return parser, lang


def load_query(lang, scm_filename):
    """Load a .scm query file and compile it."""
    query_text = (QUERIES_DIR / scm_filename).read_text(encoding="utf-8")
    return Query(lang, query_text)


def parse_file(parser, filepath):
    """Parse a Cangjie source file and return the tree and source bytes."""
    source = Path(filepath).read_bytes()
    return parser.parse(source), source


def run_query_captures(lang, query, parser, cj_filename):
    """Run a query and return {capture_name: [(text, node_type, start_point, end_point), ...]}."""
    cj_path = TESTCASE_DIR / cj_filename
    tree, source = parse_file(parser, cj_path)
    if tree.root_node.has_error:
        raise AssertionError(f"{cj_filename} must parse without recovery")

    captures = {}
    cursor = QueryCursor(query)
    result = cursor.captures(tree.root_node)
    for capture_name, nodes in result.items():
        for node in nodes:
            text = source[node.start_byte:node.end_byte].decode("utf-8", errors="replace")
            captures.setdefault(capture_name, []).append(
                (text, node.type, node.start_point, node.end_point)
            )
    return captures


def run_query_matches(lang, query, parser, cj_filename):
    """Run a query while preserving captures belonging to each match."""
    cj_path = TESTCASE_DIR / cj_filename
    tree, source = parse_file(parser, cj_path)
    if tree.root_node.has_error:
        raise AssertionError(f"{cj_filename} must parse without recovery")
    matches = []
    for pattern, captures in QueryCursor(query).matches(tree.root_node):
        converted = {}
        for capture_name, nodes in captures.items():
            converted[capture_name] = [
                (
                    source[node.start_byte:node.end_byte].decode("utf-8", errors="replace"),
                    node.type,
                    node.start_point,
                    node.end_point,
                )
                for node in nodes
            ]
        matches.append((pattern, converted))
    return matches
