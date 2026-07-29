// 仓颉 1.0.5 兼容性回归：覆盖四类语法解析问题
// 1) 中文/CJK 标识符  2) 行首点号链式调用  3) 接口无体 prop 声明  4) match case 负数字面量
package bugfix

interface 可度量 {
    prop 尺寸: Int64
    mut prop 标签: String
}

class 盒子 <: 可度量 {
    private var _标签值 = "空"

    public prop 尺寸: Int64 {
        get() { 42 }
    }

    public mut prop 标签: String {
        get() { _标签值 }
        set(v) { _标签值 = v }
    }

    public func 缩放(倍数: Int64): 盒子 {
        let _ = 倍数
        return this
    }
}

func 分类(code: Int64): String {
    return match (code) {
        case -1 => "错误"
        case -2 | -3 => "严重"
        case 0 => "空闲"
        case _ => "忙碌"
    }
}

main() {
    let 盒 = 盒子()
    盒.标签 = "满"
    let 结果 = 盒
        .缩放(2)
        .缩放(3)
        .尺寸
    println(结果)
    println(盒.标签)
    println(分类(-1))
    println(分类(-3))
}
