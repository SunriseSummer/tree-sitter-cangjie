// 测试：导入语句的全部语法形式
package test.imports

// 1. 简单导入：导入特定顶层声明
import package1.foo

// 2. 通配符导入：导入包中所有可见的顶层声明
import std.math.*

// 3. 子组导入：导入同一包的多个项
import package1.{foo, bar, fuzz}
import std.io.{InputStream, OutputStream}

// 4. 子组导入 + 别名
import std.math.{abs, max as maxInt}

// 5. 子组导入 + 通配符
import a.{b.*, c.*}

// 6. 顶层组导入：从不同包导入
import {package1.foo, package2.bar}

// 7. 顶层组通配符导入
import {package1.*, package2.*}

// 8. 顶层组导入 + 别名
import {p1.C as C1, p2.C as C2}

// 9. 顶层组包别名
import {p1 as A, p2 as B}

// 10. 包别名（简单）
import p1 as A

// 11. 包别名（多次）
import p1 as B

// 12. 项别名
import p2.f3 as f

// 13. 深层路径别名
import std.collection.ArrayList as List

// 14. 简单包导入（用于命名空间访问）
import p1
import p2

// 15. 可见性修饰符 - public 重导出
public import a.b.f

// 16. 可见性修饰符 - private（默认）
private import std.io.*

// 17. 可见性修饰符 - internal
internal import a.b.{c, d}

// 18. 可见性修饰符 - protected
protected import a.b.f

// 顶层声明
public class MyClass {
    public init() {}
}
