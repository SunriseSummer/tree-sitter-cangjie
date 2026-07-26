module cangjie-parser-example

go 1.24.13

require (
	github.com/tree-sitter/go-tree-sitter v0.25.0
	github.com/tree-sitter/tree-sitter-cangjie/bindings/go v0.0.0
)

require github.com/mattn/go-pointer v0.0.1 // indirect

replace github.com/tree-sitter/tree-sitter-cangjie/bindings/go => ../../bindings/go
