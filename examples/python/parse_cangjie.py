#!/usr/bin/env python3
"""
使用 tree-sitter-cangjie 解析仓颉源代码并展示语法树。

本脚本演示如何通过 Python 的 tree-sitter 绑定加载 tree-sitter-cangjie 插件，
解析仓颉源文件，输出完整语法树（S-expression），遍历节点打印结构化信息，
并使用 tree-sitter Query/TreeCursor 提取顶层定义（函数、类、接口、枚举）。

使用方式详见 readme.md。
"""

import os
import sys
import warnings

import tree_sitter_cangjie
from tree_sitter import Language, Parser, Node, QueryCursor

# 顶层定义类型 → 名称子节点类型的映射
_DEF_TYPES: dict[str, str] = {
    "functionDefinition":  "funcName",
    "classDefinition":     "className",
    "interfaceDefinition": "interfaceName",
    "enumDefinition":      "enumName",
    "structDefinition":    "structName",
}


def print_tree(node: Node, source: bytes, indent: int = 0):
    """递归打印语法树，显示节点类型、位置和（叶子节点的）文本。"""
    prefix = "  " * indent
    start = node.start_point
    end = node.end_point

    if node.child_count == 0:
        text = source[node.start_byte:node.end_byte].decode("utf-8", errors="replace")
        print(f"{prefix}{node.type} [{start[0]}:{start[1]}-{end[0]}:{end[1]}] \"{text}\"")
    else:
        print(f"{prefix}{node.type} [{start[0]}:{start[1]}-{end[0]}:{end[1]}]")
        for child in node.children:
            print_tree(child, source, indent + 1)


def query_definitions(root: Node, source: bytes, lang: Language) -> list[dict]:
    """使用 QueryCursor 提取顶层定义，返回 [{kind, name, line}]。"""
    query_src = """
      (functionDefinition  (funcName)      @func)
      (classDefinition     (className)     @class)
      (interfaceDefinition (interfaceName) @interface)
      (enumDefinition      (enumName)      @enum)
    """
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        query = lang.query(query_src)

    results = []
    qc = QueryCursor(query)
    for _, captures in qc.matches(root):
        for capture_name, nodes in captures.items():
            for node in nodes:
                text = source[node.start_byte:node.end_byte].decode("utf-8")
                results.append({
                    "kind": capture_name,
                    "name": text,
                    "line": node.start_point[0] + 1,
                })
    return results


def collect_errors(node: Node) -> list[Node]:
    """递归收集所有错误节点。"""
    errors: list[Node] = []
    if node.is_error or node.is_missing:
        errors.append(node)
    for child in node.children:
        errors.extend(collect_errors(child))
    return errors


def walk_with_cursor(root: Node, source: bytes):
    """使用 TreeCursor 高效遍历，仅打印命名节点（前 20 个）。"""
    cursor = root.walk()
    count = 0
    while count < 20:
        node = cursor.node
        if node.is_named:
            indent = "  " * cursor.depth
            row, col = node.start_point
            name_text = ""
            if node.child_count == 0:
                name_text = " \"" + source[node.start_byte:node.end_byte].decode("utf-8", errors="replace") + "\""
            print(f"{indent}{node.type} [{row}:{col}]{name_text}")
            count += 1
        if not cursor.goto_first_child():
            while not cursor.goto_next_sibling():
                if not cursor.goto_parent():
                    return


def main():
    sample_path = os.path.join(os.path.dirname(__file__), "..", "sample.cj")
    if not os.path.exists(sample_path):
        print(f"Error: sample file not found: {sample_path}", file=sys.stderr)
        sys.exit(1)

    # 初始化解析器
    cj_language = Language(tree_sitter_cangjie.language())
    parser = Parser(cj_language)

    # 读取并解析源文件
    with open(sample_path, "rb") as f:
        source = f.read()

    tree = parser.parse(source)
    root = tree.root_node

    # 1. 输出 S-expression
    print("=== S-expression ===")
    print(str(root))

    # 2. 输出结构化语法树
    print("\n=== Syntax Tree ===")
    print_tree(root, source)

    # 3. 统计信息
    def count_nodes(node: Node) -> int:
        return 1 + sum(count_nodes(c) for c in node.children)

    total = count_nodes(root)
    print(f"\nTotal nodes: {total}")
    print(f"Root node type: {root.type}")
    print(f"Has errors: {root.has_error}")

    # 4. Query：提取顶层定义
    print("\n=== Definitions (via Query) ===")
    defs = query_definitions(root, source, cj_language)
    for d in defs:
        print(f"  [line {d['line']:2d}] @{d['kind']}: {d['name']}")

    # 5. 错误节点检测
    print("\n=== Parse Errors ===")
    errors = collect_errors(root)
    if not errors:
        print("  No parse errors.")
    else:
        for e in errors:
            row, col = e.start_point
            kind = "MISSING" if e.is_missing else "ERROR"
            print(f"  {kind} at {row + 1}:{col + 1}")

    # 6. TreeCursor 遍历演示（前 20 个命名节点）
    print("\n=== TreeCursor Walk (first 20 named nodes) ===")
    walk_with_cursor(root, source)

    # 7. 增量解析演示：在源代码末尾追加一个新函数后重新解析
    print("\n=== Incremental Parsing Demo ===")
    appended_code = b"\n// \xe6\x96\xb0\xe5\xa2\x9e\xe5\x87\xbd\xe6\x95\xb0\nfunc square(x: Int64): Int64 {\n    return x * x\n}\n"
    new_source = source + appended_code
    start_byte = len(source)
    start_row = source.count(b"\n")

    tree.edit(
        start_byte=start_byte,
        old_end_byte=start_byte,
        new_end_byte=start_byte + len(appended_code),
        start_point=(start_row, 0),
        old_end_point=(start_row, 0),
        new_end_point=(start_row + appended_code.count(b"\n"), 0),
    )
    new_tree = parser.parse(new_source, tree)
    new_root = new_tree.root_node
    new_defs = query_definitions(new_root, new_source, cj_language)
    print(f"  After appending a new function, found {len(new_defs)} definitions:")
    for d in new_defs:
        print(f"    @{d['kind']}: {d['name']}")


if __name__ == "__main__":
    main()
