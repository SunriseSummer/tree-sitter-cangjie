; highlights.scm — tree-sitter-cangjie syntax highlighting queries

; ============================================================================
; Literals
; ============================================================================

(stringLiteral) @string

(runeLiteral) @character

(booleanLiteral) @constant.builtin

[
    (integerLiteral)
    (floatLiteral)
    (byteLiteral)
] @number

; ============================================================================
; Comments
; ============================================================================

[
    (blockComment)
    (lineComment)
] @comment

; ============================================================================
; Types
; ============================================================================

(className) @type
(structName) @type
(interfaceName) @type
(enumName) @type
(typeAliasName) @type
(Thistype) @type.builtin

(returnType) @type

[
    "Int8"
    "Int16"
    "Int32"
    "Int64"
    "IntNative"
    "UInt8"
    "UInt16"
    "UInt32"
    "UInt64"
    "UIntNative"
    "Float16"
    "Float32"
    "Float64"
    "Rune"
    "Bool"
    "Unit"
    "Nothing"
    "String"
] @type.builtin

; ============================================================================
; Functions and properties
; ============================================================================

(funcName) @function
(macroName) @function.macro
(propertyName) @property
(enumConstructor name: (identifier) @constructor)

; ============================================================================
; Variables
; ============================================================================

(varBindingPattern) @variable
(thisSuperExpression) @variable.builtin
(wildcardPattern) @variable.builtin

; ============================================================================
; Modifiers
; ============================================================================

(modifiers) @keyword.modifier

; ============================================================================
; Keywords
; ============================================================================

[
    "struct"
    "enum"
    "class"
    "interface"
    "extend"
    "type"
] @keyword.type

[
    "func"
    "main"
    "init"
    "operator"
    "macro"
    "prop"
] @keyword.function

[
    "let"
    "var"
    "const"
] @keyword.storage

[
    "if"
    "else"
    "match"
    "case"
] @keyword.conditional

[
    "for"
    "do"
    "while"
    "in"
    "break"
    "continue"
] @keyword.repeat

[
    "try"
    "catch"
    "finally"
    "throw"
] @keyword.exception

[
    "return"
] @keyword.return

[
    "import"
    "package"
] @keyword.import

[
    "public"
    "private"
    "protected"
    "internal"
    "open"
    "abstract"
    "sealed"
    "static"
    "override"
    "redef"
    "mut"
    "unsafe"
    "foreign"
    "inout"
] @keyword.modifier

[
    "is"
    "as"
    "where"
    "super"
    "this"
    "spawn"
    "synchronized"
    "quote"
    "get"
    "set"
] @keyword

; ============================================================================
; Operators
; ============================================================================

[
    "**"
    "*"
    "%"
    "/"
    "+"
    "-"
    "++"
    "--"
    "&&"
    "||"
    "!"
    "&"
    "|"
    "^"
    "<<"
    ">>"
    "="
    "+="
    "-="
    "*="
    "**="
    "/="
    "%="
    "&="
    "|="
    "^="
    "<<="
    ">>="
    "&&="
    "||="
    "->"
    "<-"
    "=>"
    "..="
    ".."
    "<:"
    "<"
    ">"
    "<="
    ">="
    "!="
    "=="
    "|>"
    "~>"
    "??"
] @operator

; ============================================================================
; Punctuation
; ============================================================================

[
    "."
    ","
    ":"
    ";"
    "@"
    "?"
    "~"
    "..."
] @punctuation.delimiter

[
    "("
    ")"
] @punctuation.bracket

[
    "["
    "]"
] @punctuation.bracket

[
    "{"
    "}"
] @punctuation.bracket
