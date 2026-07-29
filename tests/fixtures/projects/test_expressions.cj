// 测试：表达式和运算符
package test

main() {
    // 算术运算
    let a = 10 + 20
    let b = a * 3 - 5
    let c = a / 2
    let d = a % 3
    let e = 2 ** 10

    // 比较运算
    let eq = a == b
    let ne = a != b
    let lt = a < b
    let gt = a > b
    let le = a <= b
    let ge = a >= b

    // 逻辑运算
    let and = true && false
    let or = true || false
    let not = !true

    // 位运算
    let bAnd = 0xFF & 0x0F
    let bOr = 0xFF | 0x0F
    let bXor = 0xFF ^ 0x0F
    let shl = 1 << 4
    let shr = 256 >> 4

    // 赋值运算
    var x = 0
    x += 1
    x -= 1
    x *= 2
    x /= 2
    x %= 3
    x **= 2
    x &= 0xFF
    x |= 0x01
    x ^= 0xFF
    x <<= 2
    x >>= 1

    // 逻辑复合赋值运算（需 Bool 类型）
    var flag = true
    flag &&= false
    flag ||= true

    // 自增自减
    x++
    x--

    // 范围表达式
    let range1 = 0..10
    let range2 = 0..=10
    let range3 = 0..100 : 2

    // 条件表达式
    let max = if (a > b) { a } else { b }

    // is 类型检测
    let isInt = a is Int64

    // 空合运算符
    let opt: ?Int64 = None
    let val = opt ?? 0

    // 管道运算
    let addOne = { v: Int64 => v + 1 }
    let result = 42 |> addOne
}
