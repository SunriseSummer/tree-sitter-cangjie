// 测试：宏调用的各种语法形式
package test_macros_project

import test_macros_project.macrodefs.*

// 属性宏应用于声明（使用 [] 传入属性参数）
@Foo[public]
struct Data {
    var count: Int64 = 100
}

// 非属性宏应用于类声明
@Identity
class Box {
    public init() {}
    public prop value: Int64 {
        get() { 1 }
    }
}

main(): Int64 {
    // 非属性宏应用于变量声明
    @Trace let current = Box()

    println("box value: ${current.value}")

    let d = Data()
    println("count: ${d.count}")

    return 0
}
