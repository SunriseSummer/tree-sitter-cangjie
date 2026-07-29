#!/usr/bin/env python3
"""
Shared utilities for tree-sitter-cangjie SCM query tests.

Provides helper functions for loading queries, parsing files,
and running query captures.
"""

import os

import tree_sitter_cangjie
from tree_sitter import Language, Parser, Query, QueryCursor

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PACKAGE_ROOT = os.path.normpath(
    os.path.join(
        _THIS_DIR,
        os.pardir,
        os.pardir,
    )
)
REPOSITORY_ROOT = os.path.normpath(
    os.path.join(
        PACKAGE_ROOT,
        os.pardir,
        os.pardir,
    )
)
REPOSITORY_QUERIES_DIR = os.path.join(REPOSITORY_ROOT, "parser", "queries")
REPOSITORY_TESTCASE_DIR = os.path.join(
    REPOSITORY_ROOT, "tests", "fixtures", "queries"
)
if os.path.isdir(REPOSITORY_QUERIES_DIR) and os.path.isdir(
    REPOSITORY_TESTCASE_DIR
):
    QUERIES_DIR = REPOSITORY_QUERIES_DIR
    TESTCASE_DIR = REPOSITORY_TESTCASE_DIR
else:
    QUERIES_DIR = os.path.join(PACKAGE_ROOT, "vendor", "queries")
    TESTCASE_DIR = os.path.join(PACKAGE_ROOT, "vendor", "tests", "queries")


def get_parser_and_language():
    """Create a parser with the Cangjie language loaded."""
    lang = Language(tree_sitter_cangjie.language())
    parser = Parser(lang)
    return parser, lang


def load_query(lang, scm_filename):
    """Load a .scm query file and compile it."""
    scm_path = os.path.join(QUERIES_DIR, scm_filename)
    with open(scm_path, "r", encoding="utf-8") as f:
        query_text = f.read()
    return Query(lang, query_text)


def parse_file(parser, filepath):
    """Parse a Cangjie source file and return the tree and source bytes."""
    with open(filepath, "rb") as f:
        source = f.read()
    return parser.parse(source), source


def run_query_captures(lang, query, parser, cj_filename):
    """Run a query and return {capture_name: [(text, node_type, start_point, end_point), ...]}."""
    cj_path = os.path.join(TESTCASE_DIR, cj_filename)
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
    cj_path = os.path.join(TESTCASE_DIR, cj_filename)
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
