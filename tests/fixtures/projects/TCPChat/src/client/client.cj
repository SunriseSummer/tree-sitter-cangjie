package chat.client
import std.env.*
import std.net.*

main() {
    const IP = "127.0.0.1"
    const PORT: UInt16 = 23456
    const BUFFER_SIZE = 1024
    let client = TcpSocket(IP, PORT)
    // 和服务端建立连接
    client.connect()
    // 在新线程中接收控制台输入并发送到对端
    spawn {
        while (true) {
            let input = getStdIn().readln()
            let text = input.getOrDefault {''}
            client.write(text.toArray())
        }
    }
    // 在循环中不断接收服务端发来的消息并打印
    while (true) {
        let data = Array<Byte>(BUFFER_SIZE, repeat: 0)
        client.read(data)
        println(String.fromUtf8(data))
    }
}