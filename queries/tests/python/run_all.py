#!/usr/bin/env python3
"""
tree-sitter-cangjie SCM 查询测试 — 总入口

运行所有 SCM 查询测试（编译验证 + 各 SCM 文件功能测试）。

Usage:
    cd tree-sitter-cangjie
    python queries/tests/python/run_all.py
"""

import os
import sys
import unittest

# Ensure helper module is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main():
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    test_dir = os.path.dirname(os.path.abspath(__file__))

    # Discover all test_*.py modules in this directory
    discovered = loader.discover(test_dir, pattern="test_*.py")
    suite.addTests(discovered)

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    main()
