#!/usr/bin/env python3
"""Verify tags.scm against the shared Cangjie query fixture."""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from helpers import get_parser_and_language, load_query, run_query_matches


class TestTags(unittest.TestCase):
    """Verify Tree-sitter's role + @name tag protocol, not raw captures only."""

    @classmethod
    def setUpClass(cls):
        cls.parser, cls.lang = get_parser_and_language()
        cls.query = load_query(cls.lang, "tags.scm")
        cls.matches = run_query_matches(
            cls.lang, cls.query, cls.parser, "test_tags.cj"
        )

    def _matches_for(self, role):
        return [captures for _, captures in self.matches if role in captures]

    def _names_for(self, role):
        names = set()
        for captures in self._matches_for(role):
            self.assertIn("name", captures)
            self.assertEqual(len(captures["name"]), 1)
            names.add(captures["name"][0][0])
        return names

    def _assert_role_types(self, role, expected):
        for captures in self._matches_for(role):
            self.assertEqual(len(captures[role]), 1)
            self.assertIn(captures[role][0][1], expected)

    def test_every_match_pairs_outer_definition_and_name(self):
        for _, captures in self.matches:
            roles = [name for name in captures if name.startswith(("definition.", "reference."))]
            self.assertEqual(len(roles), 1)
            self.assertIn("name", captures)
            self.assertEqual(len(captures["name"]), 1)
            role_capture = captures[roles[0]][0]
            name_capture = captures["name"][0]
            same_node = (
                role_capture[1] == name_capture[1]
                and (role_capture[2], role_capture[3])
                == (name_capture[2], name_capture[3])
            )
            self.assertFalse(same_node)

    def test_type_definitions(self):
        self.assertEqual(self._names_for("definition.class"), {"MyClass", "WithProperty", "Calculator"})
        self.assertEqual(self._names_for("definition.struct"), {"MyStruct"})
        self.assertEqual(self._names_for("definition.interface"), {"MyInterface"})
        self.assertEqual(self._names_for("definition.enum"), {"MyEnum"})
        self._assert_role_types("definition.class", {"classDefinition"})
        self._assert_role_types("definition.struct", {"structDefinition"})
        self._assert_role_types("definition.interface", {"interfaceDefinition"})
        self._assert_role_types("definition.enum", {"enumDefinition"})

    def test_function_like_definitions(self):
        names = self._names_for("definition.function")
        for expected in {"myFunction", "genericFunc", "classMethod", "main", "init", "=="}:
            self.assertIn(expected, names)
        self._assert_role_types(
            "definition.function",
            {"functionDefinition", "operatorFunctionDefinition", "mainDefinition", "init"},
        )

    def test_other_definitions(self):
        self.assertEqual(self._names_for("definition.constant"), {"Value1", "Value2"})
        self.assertIn("MyTypeAlias", self._names_for("definition.type"))
        self.assertIn("value", self._names_for("definition.property"))
        self._assert_role_types("definition.constant", {"enumConstructor"})
        self._assert_role_types("definition.type", {"typeAlias"})
        self._assert_role_types("definition.property", {"propertyDefinition"})


if __name__ == "__main__":
    unittest.main(verbosity=2)
