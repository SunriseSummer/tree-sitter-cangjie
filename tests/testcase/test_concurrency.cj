// 测试：并发特性
package test

import std.sync.*

main() {
    // spawn 线程
    spawn {
        println("thread 1")
    }

    // spawn 带返回值
    let future = spawn {
        42
    }

    // synchronized 同步（使用 ReentrantMutex 监视器）
    let monitor = ReentrantMutex()
    var counter = 0
    synchronized(monitor) {
        counter++
    }

    // unsafe 块
    unsafe {
        let ptr = CPointer<Int32>()
    }
}
