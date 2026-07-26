package chat.server
import std.collection.ArrayList
import std.env.*
import std.net.*

main() {
    const PORT: UInt16 = 23456
    const BUFFER_SIZE = 1024
    let clients = ArrayList<TcpSocket>()
    let server = TcpServerSocket(bindAt: PORT)
    server.bind()
    // 在新线程中接收控制台输入并发送到对端
    spawn {
        while (true) {
            let input = getStdIn().readln()
            let text = input.getOrDefault {''}
            for (client in clients) {
                client.write(text.toArray())
            }
        }
    }
    // 循环监听客户端的连接请求，连接建立后，创建线程处理客户端发来的消息
    while (true) {
        let client: TcpSocket = server.accept()
        clients.add(client)
        spawn {
            while (true) {
                let data = Array<Byte>(BUFFER_SIZE, repeat: 0)
                client.read(data)
                String.fromUtf8(data) |> println
            }        
        }
    }
}