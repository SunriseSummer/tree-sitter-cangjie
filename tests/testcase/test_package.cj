// 测试：包声明和导入
package mypackage.subpackage

import std.math.*
import std.collection.HashMap
import std.io.{InputStream, OutputStream}

// 导入别名
import std.collection.ArrayList as List

// 顶层声明
public class MyClass {
    public init() {}
}

public struct MyStruct {
    public MyStruct(let value: Int64) {}
}

public interface MyInterface {
    func doSomething(): Unit
}

public enum MyEnum {
    | A
    | B(Int64)
}

public type MyAlias = Array<Int64>

main() {
    let obj = MyClass()
    let s = MyStruct(42)
    let e = MyEnum.A
    let alias: MyAlias = [1, 2, 3]
    println("package test ok")
}
