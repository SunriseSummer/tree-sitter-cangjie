package cube

public enum Rotation <: ToString & Hashable & Equatable<Rotation> {
    // 在魔方研究中，通常用 Front/Back/Left/Right/Up/Down
    // 表示六个面以及对应的原子操作，即正对此面顺时针旋转 90 度
    F | B | L | R | U | D
      // 支持有参构造器和递归定义，此处 X 用于组织复合旋转操作
      | X(Rotation, Rotation)
      // I(r) 表示 r 的逆变换，即正对 r 面逆时针旋转 90 度
      | I(Rotation)

    // enum 中也可以定义成员函数，这里重载 * 操作符
    // 以实现旋转操作的组合，由此可生成一个置换群
    public operator func *(that: Rotation): Rotation {
        match (this) {
            case X(x1, x2) => X(x1, X(x2, that)) // 按此顺序分解重组，递归解构时按从左到右的顺序执行变换
            case _ => X(this, that)
        }
    }

    // 重载 ** 操作符实现幂运算，用于表示和验证高阶置换操作
    // 如 (F*F*L*L*B*R)**90 会让魔方回归初态
    public operator func **(exp: UInt32): Rotation {
        var result = this
        for (_ in 0..(exp - 1)) {
            result = result * this
        }
        return result
    }

    // 实现 ToString 接口
    private func print(inv: Bool): String {
        let exp = if (inv) { '⁻¹' } else { '' }
        match (this) {
            case F => 'F${exp}'
            case B => 'B${exp}'
            case L => 'L${exp}'
            case R => 'R${exp}'
            case U => 'U${exp}'
            case D => 'D${exp}'
            case I(r) => r.print(!inv)
            case X(x1, x2) =>
                if (inv) { // 逆变换需要反序
                    x2.print(inv) + x1.print(inv)
                } else {
                    x1.print(inv) + x2.print(inv)
                }
        }
    }

    public func toString(): String {
        print(false)
    }

    // 实现 Hashable 和 Equatable 接口，以便 Rotation 作为 HashMap 的 Key
    // 也可以通过 @Derive[Hashable, Equatable] 自动实现
    public func hashCode(): Int64 {
        this.toString().hashCode()
    }

    public operator func ==(that: Rotation): Bool {
        this.toString() == that.toString()
    }

    public operator func !=(that: Rotation): Bool {
        this.toString() != that.toString()
    }
}

public type Face = Rotation