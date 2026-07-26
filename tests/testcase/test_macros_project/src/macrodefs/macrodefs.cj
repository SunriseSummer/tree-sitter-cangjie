// 宏定义包（macro package）
macro package test_macros_project.macrodefs

import std.ast.*

// 非属性宏（单参数）
public macro Trace(input: Tokens): Tokens {
    return input
}

// 属性宏（双参数，逗号分隔）
public macro Foo(attrTokens: Tokens, inputTokens: Tokens): Tokens {
    return attrTokens + inputTokens
}

// 简单透传宏
public macro Identity(input: Tokens): Tokens {
    return input
}
