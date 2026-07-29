#!/usr/bin/env python3
"""
Test: indents.scm — 缩进规则查询验证

验证 indents.scm 能正确捕获缩进节点：
- 类型定义体（class/struct/interface/enum/extend body）
- 函数/初始化器块
- 控制流（if/match/for/while/do-while/try）
- Lambda 表达式
- 数组字面量
- 闭合括号（indent.end）

Usage:
    cd tree-sitter-cangjie
    python -m pytest bindings/python/tests/queries/test_indents.py
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import get_parser_and_language, load_query, run_query_captures


class TestIndents(unittest.TestCase):
    """Verify indents.scm correctly captures indentation nodes."""

    @classmethod
    def setUpClass(cls):
        cls.parser, cls.lang = get_parser_and_language()
        cls.query = load_query(cls.lang, "indents.scm")
        cls.captures = run_query_captures(
            cls.lang, cls.query, cls.parser, "test_indents.cj"
        )

    def _indent_begin_types(self):
        return {item[1] for item in self.captures.get("indent.begin", [])}

    def _indent_end_texts(self):
        return {item[0] for item in self.captures.get("indent.end", [])}

    def test_class_body_indent(self):
        """Class body should trigger indentation."""
        self.assertIn("classBody", self._indent_begin_types())

    def test_struct_body_indent(self):
        """Struct body should trigger indentation."""
        self.assertIn("structBody", self._indent_begin_types())

    def test_interface_body_indent(self):
        """Interface body should trigger indentation."""
        self.assertIn("interfaceBody", self._indent_begin_types())

    def test_enum_body_indent(self):
        """Enum body should trigger indentation."""
        self.assertIn("enumBody", self._indent_begin_types())

    def test_extend_body_indent(self):
        """Extend body should trigger indentation."""
        self.assertIn("extendBody", self._indent_begin_types())

    def test_function_block_indent(self):
        """Function block should trigger indentation."""
        self.assertIn("block", self._indent_begin_types())

    def test_if_expression_indent(self):
        """If expression should trigger indentation."""
        self.assertIn("ifExpression", self._indent_begin_types())

    def test_match_expression_indent(self):
        """Match expression should trigger indentation."""
        self.assertIn("matchExpression", self._indent_begin_types())

    def test_match_case_indent(self):
        """Match case should trigger indentation."""
        self.assertIn("matchCase", self._indent_begin_types())

    def test_for_expression_indent(self):
        """For expression should trigger indentation."""
        self.assertIn("forInExpression", self._indent_begin_types())

    def test_while_expression_indent(self):
        """While expression should trigger indentation."""
        self.assertIn("whileExpression", self._indent_begin_types())

    def test_do_while_expression_indent(self):
        """Do-while expression should trigger indentation."""
        self.assertIn("doWhileExpression", self._indent_begin_types())

    def test_try_expression_indent(self):
        """Try expression should trigger indentation."""
        self.assertIn("tryExpression", self._indent_begin_types())

    def test_lambda_expression_indent(self):
        """Lambda expression should trigger indentation."""
        self.assertIn("lambdaExpression", self._indent_begin_types())

    def test_array_literal_indent(self):
        """Array literal should trigger indentation."""
        self.assertIn("arrayLiteral", self._indent_begin_types())

    def test_closing_brackets(self):
        """Closing brackets should trigger indent.end."""
        texts = self._indent_end_texts()
        self.assertIn("}", texts)
        self.assertIn(")", texts)
        self.assertIn("]", texts)

    def test_comment_auto_indent(self):
        """Comments should trigger indent.auto."""
        types = {item[1] for item in self.captures.get("indent.auto", [])}
        self.assertTrue(
            "lineComment" in types or "blockComment" in types,
            "Comments should trigger indent.auto"
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
