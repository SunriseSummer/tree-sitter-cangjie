// 测试：FFI 外部函数接口
package test

// 外部函数声明
foreign func rand(): Int32
foreign func printf(fmt: CString, ...): Int32
foreign func signal(value: Int32, handler: CFunc<(Int32) -> Unit>): Unit

// @C 注解的函数
@C
func handler(value: Int32) {
    println("caught signal: ${value}")
}

// 外部函数体
foreign {
    func malloc(size: UInt64): CPointer<Unit>
    func free(ptr: CPointer<Unit>): Unit
}

// unsafe main
unsafe main() {
    let text = LibC.mallocCString("random number: %d\n")
    for (_ in 0..5) {
        printf(text, rand())
    }
    LibC.free(text)
}
