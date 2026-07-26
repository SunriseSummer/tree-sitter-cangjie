// test_tags.cj — 定义标签测试
// 涵盖：类、结构体、接口、枚举、函数、类型别名、属性、扩展中的方法
package test_tags

// 类定义
class MyClass {
    public func classMethod(): Unit {}
}

// 结构体定义
struct MyStruct {
    public MyStruct(let field: Int64) {}
}

// 接口定义
interface MyInterface {
    func interfaceMethod(): Unit
}

// 枚举定义
enum MyEnum {
    | Value1 | Value2(Int64, String)
}

// 类型别名定义
type MyTypeAlias = Int64

// 函数定义
func myFunction(): Unit {}

// 带泛型的函数
func genericFunc<T>(value: T): T {
    return value
}

// 扩展定义中的方法
extend MyStruct <: MyInterface {
    public func interfaceMethod(): Unit {}
}

// 属性定义
class WithProperty {
    private var _value: Int64 = 0
    public mut prop value: Int64 {
        get() { _value }
        set(v) { _value = v }
    }
}

// 多个方法的类
class Calculator {
    public init() {}
    public func add(a: Int64, b: Int64): Int64 { return a + b }
    public func sub(a: Int64, b: Int64): Int64 { return a - b }
    public func mul(a: Int64, b: Int64): Int64 { return a * b }
    public operator func ==(other: Calculator): Bool { true }
}

main() {}
