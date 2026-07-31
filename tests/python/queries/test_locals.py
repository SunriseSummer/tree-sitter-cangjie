#!/usr/bin/env python3
"""
Test: locals.scm — 作用域/定义/引用查询验证

验证 locals.scm 能正确捕获：
- 作用域边界（local.scope）
- 变量和类型定义（local.definition）
- 变量和类型引用（local.reference）

Usage:
    cd tree-sitter-cangjie
    python -m pytest tests/python/queries/test_locals.py
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import get_parser_and_language, load_query, run_query_captures


class TestLocalsScopes(unittest.TestCase):
    """Verify locals.scm correctly captures scope boundaries."""

    @classmethod
    def setUpClass(cls):
        cls.parser, cls.lang = get_parser_and_language()
        cls.query = load_query(cls.lang, "locals.scm")
        cls.captures = run_query_captures(
            cls.lang, cls.query, cls.parser, "test_locals.cj"
        )

    def _scope_types(self):
        return {item[1] for item in self.captures.get("local.scope", [])}

    def test_translation_unit_scope(self):
        self.assertIn("translationUnit", self._scope_types())

    def test_class_scope(self):
        self.assertIn("classDefinition", self._scope_types())

    def test_struct_scope(self):
        self.assertIn("structDefinition", self._scope_types())

    def test_interface_scope(self):
        self.assertIn("interfaceDefinition", self._scope_types())

    def test_enum_scope(self):
        self.assertIn("enumDefinition", self._scope_types())

    def test_extend_scope(self):
        self.assertIn("extendDefinition", self._scope_types())

    def test_function_scope(self):
        self.assertIn("functionDefinition", self._scope_types())

    def test_main_scope(self):
        self.assertIn("mainDefinition", self._scope_types())

    def test_block_scope(self):
        self.assertIn("block", self._scope_types())

    def test_for_scope(self):
        self.assertIn("forInExpression", self._scope_types())

    def test_while_scope(self):
        self.assertIn("whileExpression", self._scope_types())

    def test_match_case_scope(self):
        self.assertIn("matchCase", self._scope_types())

    def test_try_scope(self):
        self.assertIn("tryExpression", self._scope_types())

    def test_if_scope(self):
        self.assertIn("ifExpression", self._scope_types())

    def test_lambda_scope(self):
        self.assertIn("lambdaExpression", self._scope_types())

    def test_init_scope(self):
        self.assertIn("init", self._scope_types())

    def test_property_scope(self):
        self.assertIn("propertyDefinition", self._scope_types())


class TestLocalsDefinitions(unittest.TestCase):
    """Verify locals.scm correctly captures variable definitions."""

    @classmethod
    def setUpClass(cls):
        cls.parser, cls.lang = get_parser_and_language()
        cls.query = load_query(cls.lang, "locals.scm")
        cls.captures = run_query_captures(
            cls.lang, cls.query, cls.parser, "test_locals.cj"
        )

    def _definition_texts(self):
        return {item[0] for item in self.captures.get("local.definition", [])}

    def test_class_name(self):
        self.assertIn("MyClass", self._definition_texts())

    def test_struct_name(self):
        self.assertIn("MyStruct", self._definition_texts())

    def test_interface_name(self):
        self.assertIn("MyInterface", self._definition_texts())

    def test_enum_name(self):
        self.assertIn("MyEnum", self._definition_texts())

    def test_type_alias_name(self):
        self.assertIn("MyAlias", self._definition_texts())

    def test_function_name(self):
        self.assertIn("myFunc", self._definition_texts())

    def test_property_name(self):
        self.assertIn("data", self._definition_texts())

    def test_variable_declaration(self):
        defs = self._definition_texts()
        self.assertIn("x", defs)
        self.assertIn("y", defs)

    def test_tuple_destructuring(self):
        defs = self._definition_texts()
        self.assertIn("a", defs)
        self.assertIn("b", defs)

    def test_function_parameter(self):
        self.assertIn("param", self._definition_texts())

    def test_named_parameter(self):
        self.assertIn("named", self._definition_texts())

    def test_lambda_parameter(self):
        defs = self._definition_texts()
        self.assertIn("a", defs)
        self.assertIn("b", defs)

    def test_for_in_variable(self):
        self.assertIn("i", self._definition_texts())

    def test_for_in_tuple_bindings(self):
        defs = self._definition_texts()
        self.assertIn("tupleRow", defs)
        self.assertIn("tupleColumn", defs)

    def test_nested_enum_payload_bindings(self):
        defs = self._definition_texts()
        for name in (
            "ifLeft", "ifRight", "whileLeft", "whileRight",
            "matchLeft", "matchRight",
        ):
            self.assertIn(name, defs)
        self.assertNotIn("Some", defs)

    def test_match_case_binding(self):
        self.assertIn("v", self._definition_texts())

    def test_catch_variable(self):
        self.assertIn("e", self._definition_texts())

    def test_generic_type_parameter(self):
        self.assertIn("T", self._definition_texts())

    def test_definition_multiset_has_no_unexpected_captures(self):
        actual = sorted(item[0] for item in self.captures.get("local.definition", []))
        expected = sorted([
            "MyClass", "name", "name", "speak", "displayName", "MyStruct", "MyStruct",
            "x", "y", "MyInterface", "doSomething", "MyEnum", "MyAlias", "myFunc",
            "param", "named", "x", "y", "a", "b", "identity", "T", "value",
            "Container", "_data", "data", "doSomething", "add", "a", "b", "i",
            "pairOption", "tupleRow", "tupleColumn", "ifLeft", "ifRight", "whileLeft",
            "whileRight", "matchLeft", "matchRight", "count", "v", "e", "val",
            "double", "n", "i", "inner", "n",
        ])
        self.assertEqual(actual, expected)


class TestLocalsReferences(unittest.TestCase):
    """Verify locals.scm correctly captures variable references."""

    @classmethod
    def setUpClass(cls):
        cls.parser, cls.lang = get_parser_and_language()
        cls.query = load_query(cls.lang, "locals.scm")
        cls.captures = run_query_captures(
            cls.lang, cls.query, cls.parser, "test_locals.cj"
        )

    def _reference_texts(self):
        return {item[0] for item in self.captures.get("local.reference", [])}

    def test_variable_references(self):
        refs = self._reference_texts()
        self.assertIn("param", refs)
        self.assertIn("x", refs)

    def test_function_call_reference(self):
        self.assertIn("println", self._reference_texts())

    def test_type_references(self):
        self.assertIn("Exception", self._reference_texts())


if __name__ == "__main__":
    unittest.main(verbosity=2)
