import dgram from 'dgram'

export const socketSetup = (agent, teamName, version) => {
    // Создание сокета
    const socket = dgram.createSocket({
        type: 'udp4', reuseAddr:
            true,
    })
    agent.setSocket(socket) // Задание сокета для агента
    socket.on('message', (msg, info) => {
        agent.msgGot(msg) // Обработка полученного сообщения
    })
    socket.sendMsg = (msg) => { // Отправка сообщения серверу
        socket.send(Buffer.from(msg), 6000, 'localhost', (err, bytes) => {
            if (err) throw err
        })

    }
    // Инициализация игрока на сервере (без параметра goalie)
    socket.sendMsg(`(init ${teamName} (version ${version}))`)
}
