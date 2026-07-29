// test_indents.cj — 缩进规则测试
// 涵盖：类/结构体/接口/枚举/扩展体，函数块，控制流，异常处理，Lambda，数组
package test_indents

// 类定义体缩进
class MyClass {
    let field: Int64 = 0

    public init() {}

    public func method(): Unit {
        println("method")
    }
}

// 结构体定义体缩进
struct MyStruct {
    public MyStruct(let x: Int64, let y: Int64) {}
}

// 接口定义体缩进
interface MyInterface {
    func method(): Unit
}

// 枚举定义体缩进
enum MyEnum {
    | A | B | C
}

// 扩展定义体缩进
extend MyStruct {
    public func describe(): String {
        return "struct"
    }
}

// 函数块缩进
func testControlFlow(): Unit {
    // if 表达式缩进
    if (true) {
        println("if")
    } else {
        println("else")
    }

    // match 表达式缩进
    match (42) {
        case 0 => println("zero")
        case _ => println("other")
    }

    // for-in 循环缩进
    for (i in 0..10) {
        println(i)
    }

    // while 循环缩进
    while (false) {
        break
    }

    // do-while 循环缩进
    do {
        break
    } while (false)

    // try-catch-finally 缩进
    try {
        println("try")
    } catch (e: Exception) {
        println(e)
    } finally {
        println("finally")
    }

    // Lambda 表达式缩进
    let f = { x: Int64 => x * 2 }

    // 多行 Lambda
    let g = { x: Int64 =>
        let y = x * 2
        y + 1
    }

    // 数组字面量缩进
    let arr = [1, 2, 3, 4, 5]

    // 嵌套结构缩进
    if (true) {
        for (j in 0..3) {
            match (j) {
                case 0 => println("zero")
                case _ => println("other")
            }
        }
    }
}

main() {}
