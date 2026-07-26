// test_locals.cj — 作用域、定义和引用综合测试
// 涵盖：所有作用域、变量定义、类型定义、引用
package test_locals

// ============================================================================
// 类型定义（作为 local.definition 和 local.scope）
// ============================================================================

class MyClass {
    var name: String = "class"

    public init(name: String) {
        this.name = name
    }

    public func speak(): String {
        return name
    }

    public mut prop displayName: String {
        get() { name }
        set(v) { this.name = v }
    }
}

struct MyStruct {
    public MyStruct(let x: Int64, let y: Int64) {}
}

interface MyInterface {
    func doSomething(): Unit
}

enum MyEnum { | A | B }

type MyAlias = Int64

// ============================================================================
// 函数定义（参数、命名参数、泛型）
// ============================================================================

func myFunc(param: Int64, named!: String = "default"): Int64 {
    // 变量声明
    let x = param + 1
    var y = x * 2

    // 元组解构
    let (a, b) = (1, 2)

    return a + b + y
}

// 泛型函数（类型参数定义）
func identity<T>(value: T): T {
    return value
}

// ============================================================================
// 属性定义
// ============================================================================

class Container {
    private var _data: Int64 = 0

    public mut prop data: Int64 {
        get() { _data }
        set(val) { _data = val }
    }
}

// ============================================================================
// 扩展定义
// ============================================================================

extend MyStruct <: MyInterface {
    public func doSomething(): Unit {
        println("extended")
    }
}

// ============================================================================
// Main — 所有控制流作用域和模式绑定
// ============================================================================

main() {
    // Lambda 参数定义
    let add = { a: Int64, b: Int64 => a + b }

    // For-in 循环变量
    for (i in 0..10) {
        println(i)
    }

    // Tuple and nested enum-payload bindings
    let pairOption = Some((1, 2))
    for ((tupleRow, tupleColumn) in [(1, 2)]) {
        println(tupleRow + tupleColumn)
    }
    if (let Some((ifLeft, ifRight)) <- pairOption) {
        println(ifLeft + ifRight)
    }
    while (let Some((whileLeft, whileRight)) <- pairOption) {
        println(whileLeft + whileRight)
        break
    }
    match (pairOption) {
        case Some((matchLeft, matchRight)) =>
            println(matchLeft + matchRight)
        case _ => ()
    }

    // While 作用域
    var count = 0
    while (count < 5) {
        count++
    }

    // Do-while 作用域
    do {
        count--
    } while (count > 0)

    // Match 分支模式绑定
    match (42) {
        case v => println(v)
        case _ => println("wildcard")
    }

    // Try-catch 变量
    try {
        println("try")
    } catch (e: Exception) {
        println(e)
    } finally {
        println("done")
    }

    // If 表达式作用域
    let val = 10
    if (val > 0) {
        println("positive")
    } else {
        println("non-positive")
    }

    // Lambda 表达式作用域
    let double = { n: Int64 => n * 2 }
    println(double(5))

    // 嵌套作用域
    for (i in 0..3) {
        let inner = i * 2
        match (inner) {
            case 0 => println("zero")
            case n => println(n)
        }
    }
}
