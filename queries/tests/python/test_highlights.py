#!/usr/bin/env python3
"""
Test: highlights.scm — 语法高亮查询验证

验证 highlights.scm 能正确捕获各类语法元素：
- 字面量（字符串、数字、字符、布尔）
- 注释（行注释、块注释）
- 类型名（类、结构体、接口、枚举、内置类型）
- 函数名、属性名
- 关键字（控制流、类型、存储、异常、修饰符）
- 运算符、标点符号、括号

Usage:
    cd tree-sitter-cangjie
    python queries/tests/python/test_highlights.py
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import get_parser_and_language, load_query, run_query_captures, parse_file, TESTCASE_DIR


class TestHighlights(unittest.TestCase):
    """Verify highlights.scm correctly captures syntax elements."""

    @classmethod
    def setUpClass(cls):
        cls.parser, cls.lang = get_parser_and_language()
        cls.query = load_query(cls.lang, "highlights.scm")
        cls.captures = run_query_captures(
            cls.lang, cls.query, cls.parser, "test_highlights.cj"
        )

    def _capture_names(self):
        return set(self.captures.keys())

    def _texts_for(self, capture_name):
        return {item[0] for item in self.captures.get(capture_name, [])}

    def test_string_literals(self):
        """String literals should be highlighted."""
        self.assertIn("string", self._capture_names())

    def test_number_literals(self):
        """Number literals should be highlighted."""
        self.assertIn("number", self._capture_names())

    def test_boolean_literals(self):
        """Boolean literals should be highlighted as builtin constants."""
        booleans = self._texts_for("constant.builtin")
        self.assertIn("true", booleans)
        self.assertIn("false", booleans)
        self.assertNotIn("true", self._texts_for("variable"))
        self.assertNotIn("false", self._texts_for("variable"))

    def test_comments(self):
        """Comments should be highlighted."""
        self.assertIn("comment", self._capture_names())

    def test_type_names(self):
        """Class/struct/interface/enum names should be highlighted as types."""
        texts = self._texts_for("type")
        self.assertIn("Shape", texts)
        self.assertIn("Vector", texts)
        self.assertIn("Printable", texts)
        self.assertIn("Color", texts)

    def test_builtin_types(self):
        """Built-in type nodes should exist in the parse tree."""
        cj_path = os.path.join(TESTCASE_DIR, "test_highlights.cj")
        tree, source = parse_file(self.parser, cj_path)

        type_nodes = set()
        def walk(node):
            if node.is_named and node.type in (
                "Int8", "Int16", "Int32", "Int64",
                "UInt8", "UInt16", "UInt32", "UInt64",
                "Float16", "Float32", "Float64",
                "Rune", "Bool", "String",
            ):
                type_nodes.add(node.type)
            for child in node.children:
                walk(child)
        walk(tree.root_node)

        self.assertIn("Int64", type_nodes)
        self.assertIn("Float64", type_nodes)
        self.assertIn("Bool", type_nodes)
        self.assertIn("String", type_nodes)
        self.assertIn("Rune", type_nodes)

    def test_function_names(self):
        """Function names should be highlighted."""
        texts = self._texts_for("function")
        self.assertIn("testOperators", texts)
        self.assertIn("createPoint", texts)

    def test_enum_constructor_names(self):
        """Enum constructor identifiers should use the constructor capture."""
        texts = self._texts_for("constructor")
        self.assertIn("Red", texts)
        self.assertIn("Green", texts)
        self.assertIn("Blue", texts)

    def test_keywords(self):
        """Control flow keywords should be highlighted."""
        all_texts = set()
        for name in self._capture_names():
            if name.startswith("keyword"):
                all_texts.update(self._texts_for(name))
        for kw in ["class", "func", "if", "else", "for", "while", "match",
                    "try", "catch", "return", "struct", "enum", "interface",
                    "extend", "type", "do", "break", "continue", "finally",
                    "throw", "let", "var", "case"]:
            self.assertIn(kw, all_texts, f"Keyword '{kw}' not highlighted")

    def test_operators(self):
        """Operators should be highlighted."""
        texts = self._texts_for("operator")
        for op in ["+", "-", "*", "/", "==", "!=", "&&", "||", "%", "**",
                   "<", ">", "<=", ">=", "&", "|", "^", "<<", ">>",
                   "+=", "-=", "*=", "/=", "=", "..", "..="]:
            self.assertIn(op, texts, f"Operator '{op}' not highlighted")

    def test_punctuation(self):
        """Punctuation delimiters should be highlighted."""
        texts = self._texts_for("punctuation.delimiter")
        self.assertIn(".", texts)
        self.assertIn(",", texts)
        self.assertIn(":", texts)

    def test_brackets(self):
        """Brackets should be highlighted."""
        texts = self._texts_for("punctuation.bracket")
        for b in ["(", ")", "{", "}", "[", "]"]:
            self.assertIn(b, texts, f"Bracket '{b}' not highlighted")

    def test_modifiers(self):
        """Modifiers should be highlighted."""
        all_texts = set()
        for item in self.captures.get("keyword.modifier", []):
            for word in item[0].split():
                all_texts.add(word)
        for mod in ["public", "open", "abstract", "protected"]:
            self.assertIn(mod, all_texts, f"Modifier '{mod}' not highlighted")

    def test_variable_captures(self):
        """Variable bindings should be highlighted."""
        self.assertIn("variable", self._capture_names())

    def test_property_names(self):
        """Property names should be highlighted."""
        texts = self._texts_for("property")
        self.assertIn("perimeter", texts)

    def test_character_literals(self):
        """Character (Rune) literals should be highlighted."""
        self.assertIn("character", self._capture_names())


if __name__ == "__main__":
    unittest.main(verbosity=2)
