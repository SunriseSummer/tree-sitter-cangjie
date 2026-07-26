#!/usr/bin/env python3
"""
Test: SCM 查询编译验证

验证所有 .scm 查询文件能正确编译（无语法错误）。

Usage:
    cd tree-sitter-cangjie
    python queries/tests/python/test_compilation.py
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import get_parser_and_language, load_query


class TestQueryCompilation(unittest.TestCase):
    """Verify all .scm query files compile without errors."""

    @classmethod
    def setUpClass(cls):
        cls.parser, cls.lang = get_parser_and_language()

    def test_highlights_compiles(self):
        """highlights.scm should compile without errors."""
        q = load_query(self.lang, "highlights.scm")
        self.assertIsNotNone(q)

    def test_indents_compiles(self):
        """indents.scm should compile without errors."""
        q = load_query(self.lang, "indents.scm")
        self.assertIsNotNone(q)

    def test_locals_compiles(self):
        """locals.scm should compile without errors."""
        q = load_query(self.lang, "locals.scm")
        self.assertIsNotNone(q)

    def test_tags_compiles(self):
        """tags.scm should compile without errors."""
        q = load_query(self.lang, "tags.scm")
        self.assertIsNotNone(q)

    def test_textobjects_compiles(self):
        """textobjects.scm should compile without errors."""
        q = load_query(self.lang, "textobjects.scm")
        self.assertIsNotNone(q)


if __name__ == "__main__":
    unittest.main(verbosity=2)
