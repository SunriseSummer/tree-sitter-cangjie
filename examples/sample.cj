// 示例仓颉源文件 - 用于演示 tree-sitter-cangjie 解析
package demo

import std.io.*

// 接口
interface Greetable {
    func greet(): String
}

// 类
class Person <: Greetable {
    let name: String
    var age: Int64

    init(name: String, age: Int64) {
        this.name = name
        this.age = age
    }

    public func greet(): String {
        return "Hello, I'm ${name}, ${age} years old."
    }
}

// 枚举
enum Color {
    | Red | Green | Blue
}

// 函数
func add(a: Int64, b: Int64): Int64 {
    return a + b
}

// 主函数
main() {
    let p = Person("Alice", 30)
    println(p.greet())

    var sum = 0
    for (i in 1..=10) {
        sum += i
    }
    println("Sum: ${sum}")

    let color = Color.Red
    let label = match (color) {
        case Color.Red => "red"
        case Color.Green => "green"
        case Color.Blue => "blue"
    }
    println(label)
}
