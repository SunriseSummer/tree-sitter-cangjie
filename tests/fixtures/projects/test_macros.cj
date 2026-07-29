package sample

// Macro with @C annotation on foreign function
@C
foreign func puts(value: CString): Int32

// Non-attribute macro definition (single parameter)
public macro Trace(input: Tokens): Tokens {
    quote(trace $(input))
}

// Attribute macro definition (two comma-separated parameters)
public macro Foo(attrTokens: Tokens, inputTokens: Tokens): Tokens {
    return inputTokens
}

// Macro without modifiers
macro Simple(input: Tokens): Tokens {
    return input
}

// Macro with return type and expression body
public macro Identity(input: Tokens): Tokens = input

class Box {
    prop value: Int64 {
        get() { 1 }
    }
}

main() {
    // Macro applied to variable declaration
    @Trace let current = Box()

    // Macro with parenthesized arguments
    @MyMacro(1, 2, 3)

    // Macro with bracket arguments
    @MyMacro[x, y]

    // Macro with both bracket and paren arguments
    @MyMacro[x, y](1, 2)

    // Quote expression
    let tokens = quote(let x = 1)
}
