// 测试：导入语句的多种语法形式
package test_imports_project

// 1. 通配符导入：导入包中所有可见的顶层声明
import std.math.*

// 2. 子组导入
import std.io.{InputStream, OutputStream}

// 3. 导入别名
import std.collection.ArrayList as List

// 4. 导入子包中的特定声明
import test_imports_project.pkg_a.foo

// 5. 通配符导入子包
import test_imports_project.pkg_b.*

// 6. 导入子包中的类并使用别名避免冲突
import test_imports_project.pkg_a.{C as CA}
import test_imports_project.pkg_b.{C as CB}

main(): Int64 {
    // 使用 std.math 中的函数
    let x = abs(-42.0)
    println("abs(-42.0) = ${x}")

    // 使用子包中导入的函数
    println(foo())
    println(bar())  // 来自 pkg_b 通配符导入

    // 使用别名导入的类
    let a = CA()
    let b = CB()
    println(a.name())
    println(b.name())

    // 使用 ArrayList 别名
    let list = List<Int64>()

    return 0
}
