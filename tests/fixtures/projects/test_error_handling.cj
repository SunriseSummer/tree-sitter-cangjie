// 测试：异常处理
package test

class MyError <: Exception {
    public init(message: String) {
        super(message)
    }
}

func riskyOperation(x: Int64): Int64 {
    if (x < 0) {
        throw MyError("negative input")
    }
    return x * 2
}

// 用于 try-with-resources 的资源类
class MyResource <: Resource {
    public init() {}
    public func use(): Unit {
        println("using resource")
    }
    public func isClosed(): Bool { true }
    public func close(): Unit {
        println("resource closed")
    }
}

func createResource(): MyResource {
    return MyResource()
}

main() {
    // try-catch-finally
    try {
        let result = riskyOperation(-1)
        println(result)
    } catch (e: MyError) {
        println("Caught: ${e}")
    } finally {
        println("done")
    }

    // try-finally (无 catch)
    try {
        println("trying")
    } finally {
        println("cleanup")
    }

    // 多个 catch
    try {
        let _ = riskyOperation(-1)
    } catch (e: MyError) {
        println("MyError")
    } catch (e: Exception) {
        println("Exception")
    }

    // try with resources
    try (resource = createResource()) {
        resource.use()
    } catch (_: Exception) {
        println("error")
    }
}
