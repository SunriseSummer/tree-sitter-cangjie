// 测试：extend 扩展
package test

// 扩展基本类型
extend Int64 {
    public func isEven(): Bool {
        return this % 2 == 0
    }

    public func abs(): Int64 {
        if (this < 0) { return -this }
        return this
    }
}

// 扩展实现接口
interface Displayable {
    func display(): String
}

extend Float64 <: Displayable {
    public func display(): String {
        return "${this}"
    }
}

// 扩展用户类型
class MyList<T> {
    var items: Array<T> = []
    public init() {}
}

extend<T> MyList<T> {
    public func size(): Int64 {
        return items.size
    }

    public prop isEmpty: Bool {
        get() { items.size == 0 }
    }
}

// 扩展添加运算符（使用自定义类型避免与内置 const 成员冲突）
class Repeater {
    public Repeater(let text: String) {}
}

extend Repeater {
    public operator func *(n: Int64): String {
        var result = ""
        for (_ in 0..n) {
            result = "${result}${text}"
        }
        return result
    }
}

main() {
    let n: Int64 = -5
    println(n.abs())
    println(n.isEven())

    let f: Float64 = 3.14
    println(f.display())

    let r = Repeater("ha")
    let s = r * 3
    println(s)
}
