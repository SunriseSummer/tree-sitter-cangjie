// 测试：基本变量声明、常量、类型推导
package test

import std.math.*

// 全局常量
const PI = 3.14159
const MAX_SIZE: Int64 = 1024

main() {
    // let 不可变变量
    let x: Int64 = 42
    let y = 3.14
    let name = "hello"

    // var 可变变量
    var count: Int32 = 0
    var sum = 0.0

    // 类型转换
    let n = Int64(count)
    let f = Float64(x)

    // 字符串插值
    let msg = "x = ${x}, y = ${y}"
    println(msg)

    // 布尔
    let flag = true
    let done: Bool = false

    // Rune 类型
    let ch = r'A'

    // 数组
    let arr = [1, 2, 3, 4, 5]
    let empty: Array<Int64> = []

    // 元组
    let pair = (1, "hello")
    let triple = (1, 2.0, true)

    // Unit
    let u: Unit = ()
}
