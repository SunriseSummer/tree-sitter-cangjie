; locals.scm — tree-sitter-cangjie local variable scoping queries
;
; Defines scope boundaries, variable definitions, and variable references
; for scope-aware highlighting and navigation.

; ============================================================================
; Scope definitions
; ============================================================================

; Top-level scope
(translationUnit) @local.scope

; Type definitions create scopes
(classDefinition) @local.scope
(structDefinition) @local.scope
(interfaceDefinition) @local.scope
(enumDefinition) @local.scope
(extendDefinition) @local.scope

; Function-like definitions create scopes
(functionDefinition) @local.scope
(operatorFunctionDefinition) @local.scope
(mainDefinition) @local.scope
(macroDefinition) @local.scope
(init) @local.scope
(primaryInit) @local.scope

; Block creates scope
(block) @local.scope

; Lambda expressions create scopes
(lambdaExpression) @local.scope
(trailingLambdaExpression) @local.scope

; Control flow with pattern bindings create scopes
(forInExpression) @local.scope
(whileExpression) @local.scope
(ifExpression) @local.scope
(matchCase) @local.scope
(matchCaseBody) @local.scope

; Property getter/setter creates scope
(propertyDefinition) @local.scope

; Exception handling creates scope
(tryExpression) @local.scope

; ============================================================================
; Definitions
; ============================================================================

; Variable declarations
(variableDeclaration
  (variableName
    (varBindingPattern) @local.definition))

; Bindings inside tuple patterns. Every nested tuplePattern is matched on its
; own, so this covers arbitrary nesting in declarations, enum payloads,
; for-in loops, if/while-let conditions and match cases.
(tuplePattern
  (varBindingPattern) @local.definition)

; Function parameters
(parameter
  paraName: (identifier) @local.definition)

; Named function parameters
(namedParameter
  paraName: (identifier) @local.definition)

; Lambda parameters
(lambdaParameter
  (varBindingPattern) @local.definition)

; For-in loop variable
(forInExpression
  (varBindingPattern) @local.definition)

; While-let binding
(whileExpression
  (varBindingPattern) @local.definition)

; If-let binding
(ifExpression
  (varBindingPattern) @local.definition)

; Match case pattern bindings
(matchCase
  (varBindingPattern) @local.definition)

; Catch variable
(catchPattern
  (varBindingPattern) @local.definition)

; Try-with-resources variable
(resourceSpecification
  (identifier) @local.definition)

; Function/method/type definitions
(funcName) @local.definition
(className) @local.definition
(structName) @local.definition
(interfaceName) @local.definition
(enumName) @local.definition
(typeAliasName) @local.definition
(macroName) @local.definition
(propertyName) @local.definition

; Type parameters
(typeParameters
  (identifier) @local.definition)

; ============================================================================
; References
; ============================================================================

; Variable references
(atomicVariable
  (varBindingPattern) @local.reference)

; Type references
(userType
  (identifier) @local.reference)
