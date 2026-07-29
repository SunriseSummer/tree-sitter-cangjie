// test_textobjects.cj — 文本对象测试
// 涵盖：类/结构体/接口/枚举/扩展体，函数块，循环，条件，注释，参数
package test_textobjects

// ============================================================================
// 类和结构体文本对象
// ============================================================================

class OuterClass {
    let field: Int64 = 0

    public func method(param: Int64): Int64 {
        return param + field
    }
}

struct MyStruct {
    public MyStruct(let x: Int64, let y: Int64) {}
}

interface MyInterface {
    func doSomething(): Unit
}

enum MyEnum {
    | First | Second | Third
}

extend MyStruct {
    public func display(): Unit {
        println("struct")
    }
}

// ============================================================================
// 函数文本对象
// ============================================================================

func standalone(a: Int64, b: Int64): Int64 {
    return a + b
}

func withLogic(x: Int64): Int64 {
    if (x > 0) {
        return x
    }
    return -x
}

// ============================================================================
// 注释文本对象
// ============================================================================

// 单行注释第一行
// 单行注释第二行（连续注释组）

/* 块注释
   跨多行的块注释 */

// ============================================================================
// Lambda 文本对象
// ============================================================================

func withLambda(value: String): Unit {
    let transform = { x: Int64 => x * 2 }
    let multiLine = { x: Int64 =>
        let y = x + 1
        y * 2
    }
    println(value)
}

// ============================================================================
// 控制流文本对象
// ============================================================================

main() {
    // 循环文本对象
    for (i in 0..10) {
        println(i)
    }

    while (true) {
        break
    }

    do {
        break
    } while (false)

    // 条件文本对象
    if (true) {
        println("yes")
    } else {
        println("no")
    }

    // 嵌套循环和条件
    for (j in 0..5) {
        if (j > 2) {
            while (false) {
                break
            }
        }
    }
}
