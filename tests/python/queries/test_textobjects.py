#!/usr/bin/env python3
"""
Test: textobjects.scm — 文本对象查询验证

验证 textobjects.scm 能正确捕获文本对象：
- class.inside/around（类/结构体/接口/枚举/扩展体）
- function.inside/around（函数块）
- loop.inside/around（for/while/do-while 循环）
- conditional.inside/around（if 条件表达式）
- comment.inside/around（注释）
- parameter.inside/around（参数列表）

Usage:
    cd tree-sitter-cangjie
    python -m pytest tests/python/queries/test_textobjects.py
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import get_parser_and_language, load_query, run_query_captures


class TestTextObjects(unittest.TestCase):
    """Verify textobjects.scm correctly captures text objects."""

    @classmethod
    def setUpClass(cls):
        cls.parser, cls.lang = get_parser_and_language()
        cls.query = load_query(cls.lang, "textobjects.scm")
        cls.captures = run_query_captures(
            cls.lang, cls.query, cls.parser, "test_textobjects.cj"
        )

    def _capture_names(self):
        return set(self.captures.keys())

    def test_class_inside(self):
        self.assertIn("class.inside", self._capture_names())

    def test_class_around(self):
        self.assertIn("class.around", self._capture_names())

    def test_function_inside(self):
        self.assertIn("function.inside", self._capture_names())

    def test_function_around(self):
        self.assertIn("function.around", self._capture_names())

    def test_loop_inside(self):
        self.assertIn("loop.inside", self._capture_names())

    def test_loop_around(self):
        self.assertIn("loop.around", self._capture_names())

    def test_conditional_inside(self):
        self.assertIn("conditional.inside", self._capture_names())

    def test_conditional_around(self):
        self.assertIn("conditional.around", self._capture_names())

    def test_comment_inside(self):
        self.assertIn("comment.inside", self._capture_names())

    def test_comment_around(self):
        self.assertIn("comment.around", self._capture_names())

    def test_parameter_inside(self):
        self.assertIn("parameter.inside", self._capture_names())

    def test_parameter_around(self):
        self.assertIn("parameter.around", self._capture_names())


if __name__ == "__main__":
    unittest.main(verbosity=2)
