// 子包 pkg_a：提供 foo, bar, fuzz 供导入测试
package test_imports_project.pkg_a

public func foo(): String {
    return "foo from pkg_a"
}

public func bar(): String {
    return "bar from pkg_a"
}

public func fuzz(): String {
    return "fuzz from pkg_a"
}

public class C {
    public init() {}
    public func name(): String { "C from pkg_a" }
}
