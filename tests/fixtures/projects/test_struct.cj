// 测试：结构体定义
package test

struct Point {
    public Point(let x: Float64, let y: Float64) {}

    public func distance(other: Point): Float64 {
        let dx = x - other.x
        let dy = y - other.y
        return (dx * dx + dy * dy)
    }

    public operator func +(other: Point): Point {
        return Point(x + other.x, y + other.y)
    }

    public operator func ==(other: Point): Bool {
        return x == other.x && y == other.y
    }

    public prop magnitude: Float64 {
        get() { x * x + y * y }
    }
}

// 结构体实现接口
interface Describable {
    func describe(): String
}

struct Color <: Describable {
    public Color(let r: UInt8, let g: UInt8, let b: UInt8) {}

    public func describe(): String {
        return "RGB(${r}, ${g}, ${b})"
    }
}

main() {
    let p1 = Point(1.0, 2.0)
    let p2 = Point(3.0, 4.0)
    let p3 = p1 + p2
    println(p1 == p2)

    let red = Color(255, 0, 0)
    println(red.describe())
}
