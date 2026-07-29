// 测试：控制流语句
package test

main() {
    // if-else
    let x = 10
    if (x > 0) {
        println("positive")
    } else if (x < 0) {
        println("negative")
    } else {
        println("zero")
    }

    // for-in 循环
    for (i in 0..10) {
        println(i)
    }

    // for-in 带步长
    for (i in 0..=100 : 2) {
        println(i)
    }

    // for-in 集合
    let items = [1, 2, 3, 4, 5]
    for (item in items) {
        println(item)
    }

    // for-in 带 where 守卫
    for (i in 0..100 where i % 2 == 0) {
        println(i)
    }

    // while 循环
    var count = 0
    while (count < 10) {
        count++
    }

    // do-while 循环
    var n = 0
    do {
        n++
    } while (n < 5)

    // break 和 continue
    for (i in 0..100) {
        if (i == 50) {
            break
        }
        if (i % 2 == 0) {
            continue
        }
        println(i)
    }
}
