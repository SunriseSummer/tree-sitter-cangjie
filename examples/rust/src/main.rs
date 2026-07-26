//! 使用 tree-sitter-cangjie 解析仓颉源代码并展示语法树。
//!
//! 本程序演示如何在 Rust 中使用 tree-sitter 和 tree-sitter-cangjie 解析仓颉源文件，
//! 输出完整语法树（S-expression），遍历节点打印结构化信息，
//! 并使用 tree-sitter Query 提取顶层定义（函数、类、接口、枚举）。
//!
//! 使用方式详见 readme.md。

use std::fs;
use std::path::PathBuf;
use tree_sitter::{InputEdit, Node, Parser, Point, Query, QueryCursor, StreamingIterator};
use tree_sitter_cangjie::LANGUAGE;

/// 递归打印语法树，显示节点类型、位置和（叶子节点的）文本。
fn print_tree(node: Node, source: &[u8], indent: usize) {
    let prefix = "  ".repeat(indent);
    let start = node.start_position();
    let end = node.end_position();

    if node.child_count() == 0 {
        let text = node.utf8_text(source).unwrap_or("");
        println!(
            "{}{} [{}:{}-{}:{}] \"{}\"",
            prefix,
            node.kind(),
            start.row,
            start.column,
            end.row,
            end.column,
            text
        );
    } else {
        println!(
            "{}{} [{}:{}-{}:{}]",
            prefix,
            node.kind(),
            start.row,
            start.column,
            end.row,
            end.column
        );
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            print_tree(child, source, indent + 1);
        }
    }
}

/// 递归统计节点总数。
fn count_nodes(node: Node) -> usize {
    let mut count = 1;
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        count += count_nodes(child);
    }
    count
}

/// 顶层定义信息。
struct Definition {
    kind: String,
    name: String,
    line: usize,
}

/// 使用 tree-sitter Query 提取顶层定义（函数、类、接口、枚举）。
fn query_definitions(node: Node, source: &[u8]) -> Vec<Definition> {
    let language = LANGUAGE.into();
    let query_src = r#"
        (functionDefinition  (funcName)      @func)
        (classDefinition     (className)     @class)
        (interfaceDefinition (interfaceName) @interface)
        (enumDefinition      (enumName)      @enum)
    "#;
    let query = Query::new(&language, query_src).expect("invalid query");
    let mut cursor = QueryCursor::new();
    let mut defs = Vec::new();
    let mut matches = cursor.matches(&query, node, source);
    while let Some(mat) = matches.next() {
        for cap in mat.captures {
            let cap_node = cap.node;
            let name = query.capture_names()[cap.index as usize].to_string();
            let text = cap_node.utf8_text(source).unwrap_or("").to_string();
            defs.push(Definition {
                kind: name,
                name: text,
                line: cap_node.start_position().row + 1,
            });
        }
    }
    defs
}

/// 递归收集所有错误节点的位置信息。
fn collect_errors(node: Node) -> Vec<(usize, usize, bool)> {
    let mut errors = Vec::new();
    if node.is_error() || node.is_missing() {
        let pos = node.start_position();
        errors.push((pos.row + 1, pos.column + 1, node.is_missing()));
    }
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        errors.extend(collect_errors(child));
    }
    errors
}

fn main() {
    // 定位 sample.cj 文件
    let sample_path: PathBuf = [env!("CARGO_MANIFEST_DIR"), "..", "sample.cj"]
        .iter()
        .collect();

    let source = fs::read(&sample_path).unwrap_or_else(|e| {
        eprintln!("Error: cannot read file {}: {}", sample_path.display(), e);
        std::process::exit(1);
    });

    // 初始化解析器
    let mut parser = Parser::new();
    parser
        .set_language(&LANGUAGE.into())
        .expect("Error loading Cangjie parser");

    // 解析源代码
    let mut tree = parser.parse(&source, None).expect("Failed to parse");
    let root = tree.root_node();

    // 1. 输出 S-expression
    println!("=== S-expression ===");
    println!("{}", root.to_sexp());

    // 2. 输出结构化语法树
    println!("\n=== Syntax Tree ===");
    print_tree(root, &source, 0);

    // 3. 统计信息
    let total = count_nodes(root);
    println!("\nTotal nodes: {}", total);
    println!("Root node type: {}", root.kind());
    println!("Has errors: {}", root.has_error());

    // 4. Query：提取顶层定义
    println!("\n=== Definitions (via Query) ===");
    let defs = query_definitions(root, &source);
    for d in &defs {
        println!("  [line {:2}] @{}: {}", d.line, d.kind, d.name);
    }

    // 5. 错误节点检测
    println!("\n=== Parse Errors ===");
    let errors = collect_errors(root);
    if errors.is_empty() {
        println!("  No parse errors.");
    } else {
        for (row, col, missing) in &errors {
            let kind = if *missing { "MISSING" } else { "ERROR" };
            println!("  {} at {}:{}", kind, row, col);
        }
    }

    // 6. 增量解析演示：追加一个新函数后重新解析
    println!("\n=== Incremental Parsing Demo ===");
    let appended_code = b"\n// \xe6\x96\xb0\xe5\xa2\x9e\xe5\x87\xbd\xe6\x95\xb0\nfunc square(x: Int64): Int64 {\n    return x * x\n}\n";
    let start_byte = source.len();
    let start_row = source.iter().filter(|&&b| b == b'\n').count();

    tree.edit(&InputEdit {
        start_byte,
        old_end_byte: start_byte,
        new_end_byte: start_byte + appended_code.len(),
        start_position: Point { row: start_row, column: 0 },
        old_end_position: Point { row: start_row, column: 0 },
        new_end_position: Point {
            row: start_row + appended_code.iter().filter(|&&b| b == b'\n').count(),
            column: 0,
        },
    });

    let mut new_source = source.clone();
    new_source.extend_from_slice(appended_code);
    let new_tree = parser.parse(&new_source, Some(&tree)).expect("Failed to reparse");
    let new_defs = query_definitions(new_tree.root_node(), &new_source);
    println!("  After appending a new function, found {} definitions:", new_defs.len());
    for d in &new_defs {
        println!("    @{}: {}", d.kind, d.name);
    }
}
