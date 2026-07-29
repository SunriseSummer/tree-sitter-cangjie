// 测试：Lambda 表达式和高阶函数
package test

func apply(f: (Int64) -> Int64, x: Int64): Int64 {
    return f(x)
}

func compose(f: (Int64) -> Int64, g: (Int64) -> Int64): (Int64) -> Int64 {
    return { x: Int64 => f(g(x)) }
}

main() {
    // 基本 lambda
    let double = { x: Int64 => x * 2 }
    let add1 = { x: Int64 => x + 1 }

    // 调用高阶函数
    let result = apply(double, 5)
    println(result)

    // 函数组合
    let doubleAndAdd = compose(add1, double)
    println(doubleAndAdd(3))

    // 尾随 lambda
    let items = [1, 2, 3, 4, 5]

    // 多参数 lambda
    let add = { a: Int64, b: Int64 => a + b }
    println(add(1, 2))

    // 流操作
    let sum = 0 |> add1
    println(sum)
}
