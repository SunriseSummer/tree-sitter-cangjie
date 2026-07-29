// 测试：泛型类、泛型约束、类型别名
package test

import std.collection.*

// 泛型类
class Box<T> {
    public Box(let value: T) {}

    public func map<U>(f: (T) -> U): Box<U> {
        return Box<U>(f(value))
    }
}

// 泛型约束
interface Comparable<T> {
    operator func <(other: T): Bool
}

func max<T>(a: T, b: T): T where T <: Comparable<T> {
    if (a < b) { return b }
    return a
}

// 多约束
func process<T>(item: T) where T <: ToString & Comparable<T> {
    println(item.toString())
}

// 类型别名
type IntList = Array<Int64>
type StringMap<V> = HashMap<String, V>
type Predicate<T> = (T) -> Bool

main() {
    let box = Box<Int64>(42)
    let strBox = box.map<String> { x: Int64 => "${x}" }

    let list: IntList = [1, 2, 3]
    let pred: Predicate<Int64> = { x: Int64 => x > 0 }
    println(pred(5))
}
