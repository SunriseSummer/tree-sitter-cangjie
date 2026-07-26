/*
使用 tree-sitter-cangjie 解析仓颉源代码并展示语法树。

本程序演示如何在 Go 中使用 go-tree-sitter 加载 tree-sitter-cangjie 插件，
解析仓颉源文件，输出完整语法树（S-expression），遍历节点打印结构化信息，
并使用 tree-sitter Query 提取顶层定义（函数、类、接口、枚举）。

使用方式详见 readme.md。
*/
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_cangjie "github.com/tree-sitter/tree-sitter-cangjie/bindings/go"
)

// definition 表示一个顶层定义。
type definition struct {
	kind string
	name string
	line uint
}

// printTree 递归打印语法树，显示节点类型、位置和（叶子节点的）文本。
func printTree(node *tree_sitter.Node, source []byte, indent int) {
	prefix := strings.Repeat("  ", indent)
	start := node.StartPosition()
	end := node.EndPosition()

	if node.ChildCount() == 0 {
		text := node.Utf8Text(source)
		fmt.Printf("%s%s [%d:%d-%d:%d] \"%s\"\n", prefix, node.Kind(),
			start.Row, start.Column, end.Row, end.Column, text)
	} else {
		fmt.Printf("%s%s [%d:%d-%d:%d]\n", prefix, node.Kind(),
			start.Row, start.Column, end.Row, end.Column)
		for i := uint(0); i < node.ChildCount(); i++ {
			child := node.Child(i)
			if child != nil {
				printTree(child, source, indent+1)
			}
		}
	}
}

// countNodes 递归统计节点总数。
func countNodes(node *tree_sitter.Node) int {
	count := 1
	for i := uint(0); i < node.ChildCount(); i++ {
		child := node.Child(i)
		if child != nil {
			count += countNodes(child)
		}
	}
	return count
}

// queryDefinitions 使用 tree-sitter Query 提取顶层定义。
func queryDefinitions(lang *tree_sitter.Language, root *tree_sitter.Node, source []byte) []definition {
	querySource := `
		(functionDefinition  (funcName)      @func)
		(classDefinition     (className)     @class)
		(interfaceDefinition (interfaceName) @interface)
		(enumDefinition      (enumName)      @enum)
	`
	query, qErr := tree_sitter.NewQuery(lang, querySource)
	if qErr != nil {
		fmt.Fprintf(os.Stderr, "Query error: %v\n", qErr)
		return nil
	}
	defer query.Close()

	qc := tree_sitter.NewQueryCursor()
	defer qc.Close()
	matches := qc.Matches(query, root, source)

	captureNames := query.CaptureNames()
	var defs []definition
	for match := matches.Next(); match != nil; match = matches.Next() {
		for _, cap := range match.Captures {
			node := cap.Node
			name := captureNames[cap.Index]
			text := node.Utf8Text(source)
			defs = append(defs, definition{
				kind: name,
				name: text,
				line: node.StartPosition().Row + 1,
			})
		}
	}
	return defs
}

// collectErrors 递归收集所有错误节点。
func collectErrors(node *tree_sitter.Node) []*tree_sitter.Node {
	var errors []*tree_sitter.Node
	if node.IsError() || node.IsMissing() {
		errors = append(errors, node)
	}
	for i := uint(0); i < node.ChildCount(); i++ {
		child := node.Child(i)
		if child != nil {
			errors = append(errors, collectErrors(child)...)
		}
	}
	return errors
}

func main() {
	// 定位 sample.cj 文件
	_, filename, _, _ := runtime.Caller(0)
	samplePath := filepath.Join(filepath.Dir(filename), "..", "sample.cj")

	source, err := os.ReadFile(samplePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: cannot read file: %s\n", samplePath)
		os.Exit(1)
	}

	// 初始化解析器
	parser := tree_sitter.NewParser()
	defer parser.Close()

	lang := tree_sitter.NewLanguage(tree_sitter_cangjie.Language())
	if err := parser.SetLanguage(lang); err != nil {
		fmt.Fprintf(os.Stderr, "Error: cannot set language: %v\n", err)
		os.Exit(1)
	}

	// 解析源代码
	tree := parser.Parse(source, nil)
	defer tree.Close()

	root := tree.RootNode()

	// 1. 输出 S-expression
	fmt.Println("=== S-expression ===")
	fmt.Println(root.ToSexp())

	// 2. 输出结构化语法树
	fmt.Println("\n=== Syntax Tree ===")
	printTree(root, source, 0)

	// 3. 统计信息
	total := countNodes(root)
	fmt.Printf("\nTotal nodes: %d\n", total)
	fmt.Printf("Root node type: %s\n", root.Kind())
	fmt.Printf("Has errors: %t\n", root.HasError())

	// 4. Query：提取顶层定义
	fmt.Println("\n=== Definitions (via Query) ===")
	defs := queryDefinitions(lang, root, source)
	for _, d := range defs {
		fmt.Printf("  [line %2d] @%s: %s\n", d.line, d.kind, d.name)
	}

	// 5. 错误节点检测
	fmt.Println("\n=== Parse Errors ===")
	errors := collectErrors(root)
	if len(errors) == 0 {
		fmt.Println("  No parse errors.")
	} else {
		for _, e := range errors {
			pos := e.StartPosition()
			kind := "ERROR"
			if e.IsMissing() {
				kind = "MISSING"
			}
			fmt.Printf("  %s at %d:%d\n", kind, pos.Row+1, pos.Column+1)
		}
	}

	// 6. 增量解析演示：追加一个新函数后重新解析
	fmt.Println("\n=== Incremental Parsing Demo ===")
	appendedCode := []byte("\n// 新增函数\nfunc square(x: Int64): Int64 {\n    return x * x\n}\n")
	newSource := append(source, appendedCode...)

	startByte := uint(len(source))
	startRow := uint(strings.Count(string(source), "\n"))
	edit := tree_sitter.InputEdit{
		StartByte:      startByte,
		OldEndByte:     startByte,
		NewEndByte:     startByte + uint(len(appendedCode)),
		StartPosition:  tree_sitter.Point{Row: startRow, Column: 0},
		OldEndPosition: tree_sitter.Point{Row: startRow, Column: 0},
		NewEndPosition: tree_sitter.Point{
			Row:    startRow + uint(strings.Count(string(appendedCode), "\n")),
			Column: 0,
		},
	}
	tree.Edit(&edit)
	newTree := parser.Parse(newSource, tree)
	defer newTree.Close()

	newDefs := queryDefinitions(lang, newTree.RootNode(), newSource)
	fmt.Printf("  After appending a new function, found %d definitions:\n", len(newDefs))
	for _, d := range newDefs {
		fmt.Printf("    @%s: %s\n", d.kind, d.name)
	}
}
