// 子包 pkg_b：提供 bar, C 供导入测试
package test_imports_project.pkg_b

public func bar(): String {
    return "bar from pkg_b"
}

public class C {
    public init() {}
    public func name(): String { "C from pkg_b" }
}
