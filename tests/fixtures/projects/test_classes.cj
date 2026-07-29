// 测试：类定义、继承、接口、主构造器、属性
package test

// 简单接口
interface Drawable {
    func draw(): Unit
}

// 带默认实现的接口
interface Printable {
    func display(): String {
        return "Printable"
    }
}

// 基类
open class Shape <: Drawable & Printable {
    public Shape(protected let name: String) {}

    public open func draw(): Unit {
        println("Drawing ${name}")
    }

    public open prop area: Float64 {
        get() { 0.0 }
    }
}

// 继承类
class Circle <: Shape {
    public Circle(let radius: Float64) {
        super("Circle")
    }

    public override func draw(): Unit {
        println("Drawing circle with radius ${radius}")
    }

    public override prop area: Float64 {
        get() { 3.14159 * radius * radius }
    }
}

// 类使用 mut prop
class Counter {
    private var count: Int64 = 0

    public mut prop value: Int64 {
        set(v) {
            count = v
        }
        get() { count }
    }

    public func increment() {
        count++
    }
}

// 抽象类
abstract class Animal {
    public func breathe() {
        println("breathing")
    }
    public func speak(): String
}

// 密封抽象类
sealed abstract class Result<T> {}

// 类的析构器
class Resource {
    public init() {
        println("Resource created")
    }

    ~init() {
        println("Resource destroyed")
    }
}

// 静态初始化
class Config {
    static var instance: ?Config = None
    static init() {
        instance = Config()
    }
    public init() {}
}

main() {
    let circle = Circle(5.0)
    circle.draw()
    println(circle.area)

    let counter = Counter()
    counter.increment()
    counter.value = 10
}
