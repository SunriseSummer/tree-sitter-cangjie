// 测试：函数定义、命名参数、默认参数、泛型函数
package test

// 普通函数
func add(a: Int64, b: Int64): Int64 {
    return a + b
}

// 无返回值
func greet(name: String) {
    println("Hello, ${name}!")
}

// 命名参数和默认值
func createUser(name: String, age!: Int64 = 18, city!: String = "Beijing"): String {
    return "${name}, ${age}, ${city}"
}

// 泛型函数
func identity<T>(x: T): T {
    return x
}

// 泛型约束
func printAll<T>(items: Array<T>) where T <: ToString {
    for (item in items) {
        println(item.toString())
    }
}

// 运算符重载函数（使用自定义类型避免 String 内置 const 成员冲突）
class Vector2D {
    public Vector2D(let x: Float64, let y: Float64) {}

    public operator func +(other: Vector2D): Vector2D {
        return Vector2D(x + other.x, y + other.y)
    }
}

// 可变参数 (foreign)
foreign func printf(fmt: CString, ...): Int32

main() {
    let result = add(1, 2)
    greet("World")
    let user = createUser("Alice", age: 25)
    let id = identity<Int64>(42)
}
