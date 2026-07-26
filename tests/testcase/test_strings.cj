// 测试：字符串、多行字符串、字符串插值
package test

main() {
    // 普通字符串
    let s1 = "hello world"
    let s2 = 'hello world'

    // 转义字符
    let s3 = "hello\nworld\t!"
    let s4 = "path: C:\\Users\\test"

    // 字符串插值
    let name = "Alice"
    let age = 25
    let msg = "Name: ${name}, Age: ${age}"
    let expr = "1 + 2 = ${1 + 2}"

    // URL 中包含 // (不应被解析为注释)
    let url = "https://api.example.com/v1/users"
    let path = "file:///home/user/docs"

    // 多行字符串
    let multiline = """
Hello World
This is a multi-line string
With "quotes" inside
And special chars: // not a comment
"""

    // Unicode
    let unicode = "\u{4F60}\u{597D}"
    let emoji = "Hello 🌍"

    println(url)
    println(multiline)
}
