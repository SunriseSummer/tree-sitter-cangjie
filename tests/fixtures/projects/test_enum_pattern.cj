// 测试：枚举、模式匹配
package test

// 简单枚举
enum Color {
    | Red
    | Green
    | Blue
}

// 带参数的枚举
enum Expr {
    | Num(Float64)
    | Add(Expr, Expr)
    | Sub(Expr, Expr)
    | Mul(Expr, Expr)

    public func eval(): Float64 {
        match (this) {
            case Num(value) => value
            case Add(l, r) => l.eval() + r.eval()
            case Sub(l, r) => l.eval() - r.eval()
            case Mul(l, r) => l.eval() * r.eval()
        }
    }
}

// 泛型枚举
enum Option<T> {
    | Some(T)
    | None
}

main() {
    // 基本模式匹配
    let color = Color.Red
    match (color) {
        case Color.Red => println("red")
        case Color.Green => println("green")
        case Color.Blue => println("blue")
    }

    // 带 where 守卫的模式匹配
    let x = 42
    match (x) {
        case n where n > 0 => println("positive")
        case n where n < 0 => println("negative")
        case _ => println("zero")
    }

    // 元组模式匹配
    let pair = (1, "hello")
    match (pair) {
        case (1, s) => println(s)
        case (_, _) => println("other")
    }

    // 表达式求值
    let expr = Expr.Add(Expr.Num(1.0), Expr.Mul(Expr.Num(2.0), Expr.Num(3.0)))
    println(expr.eval())

    // if-let 模式
    let opt: Option<Int64> = Option<Int64>.Some(42)
    if (let Option.Some(v) <- opt) {
        println(v)
    }
}
