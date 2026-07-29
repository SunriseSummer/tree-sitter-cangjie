// test_highlights.cj — 语法高亮测试
// 涵盖：所有关键字、运算符、字面量、类型、标点符号、修饰符
package test_highlights

// ============================================================================
// 类型定义关键字
// ============================================================================

// open class 修饰符
open class Shape {
    public var sides: Int64 = 0
    protected var area: Float64 = 0.0

    public init(sides: Int64) {
        this.sides = sides
    }

    public open func describe(): String {
        return "Shape with ${sides} sides"
    }

    // 属性定义 (prop 关键字)
    public mut prop perimeter: Float64 {
        get() { 0.0 }
        set(v) { this.area = v }
    }
}

// abstract 修饰符
abstract class Animal {
    public func speak(): String
}

// interface 关键字
interface Printable {
    func display(): Unit
}

// struct 关键字
struct Vector {
    public Vector(let x: Float64, let y: Float64) {}
}

// enum 关键字
enum Color {
    | Red | Green | Blue
}

// type 别名关键字
type StringAlias = String

// extend 关键字
extend Vector <: Printable {
    public func display(): Unit {
        println("Vector(${x}, ${y})")
    }
}

// ============================================================================
// 函数和运算符
// ============================================================================

func testOperators(a: Int64, b: Int64): Bool {
    // 算术运算符
    let sum = a + b
    let diff = a - b
    let prod = a * b
    let quot = a / b
    let rem = a % b
    let pow = a ** UInt64(b)

    // 比较运算符
    let eq = a == b
    let ne = a != b
    let lt = a < b
    let gt = a > b
    let le = a <= b
    let ge = a >= b

    // 逻辑运算符
    let and = true && false
    let or = true || false
    let not = !true

    // 位运算符
    let bAnd = a & b
    let bOr = a | b
    let bXor = a ^ b
    let shl = a << 2
    let shr = a >> 2

    return eq
}

// 命名参数函数
func createPoint(x!: Float64 = 0.0, y!: Float64 = 0.0): Unit {
    println("Point(${x}, ${y})")
}

// ============================================================================
// Main — 字面量和控制流关键字
// ============================================================================

main() {
    // 基本字面量
    let intVal: Int64 = 42
    let floatVal: Float64 = 3.14
    let boolVal: Bool = true
    let strVal: String = "hello"
    let runeVal: Rune = r'A'

    // 数组字面量（方括号覆盖）
    let items = [1, 2, 3]

    // 所有内置类型
    let i8: Int8 = 0
    let i16: Int16 = 0
    let i32: Int32 = 0
    let i64: Int64 = 0
    let u8: UInt8 = 0
    let u16: UInt16 = 0
    let u32: UInt32 = 0
    let u64: UInt64 = 0
    let f16: Float16 = 0.0
    let f32: Float32 = 0.0
    let f64: Float64 = 0.0

    // if / else 关键字
    if (true) {
        println("if")
    } else {
        println("else")
    }

    // for / in / break / continue 关键字
    for (i in 0..10) {
        if (i == 5) {
            break
        }
        if (i % 2 == 0) {
            continue
        }
    }

    // while 关键字
    while (false) {}

    // do / while 关键字
    do {
        break
    } while (false)

    // match / case 关键字
    match (intVal) {
        case 0 => println("zero")
        case _ => println("other")
    }

    // try / catch / finally / throw 关键字
    try {
        throw Exception("test")
    } catch (e: Exception) {
        println(e)
    } finally {
        println("done")
    }

    // 范围运算符
    let r1 = 0..10
    let r2 = 0..=10

    // 赋值运算符
    var x = 0
    x += 1
    x -= 1
    x *= 2
    x /= 2

    // var / let / const 关键字（var 和 let 已在上面覆盖）

    // return 关键字
    return
}
