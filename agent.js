const Msg = require('./msg')
const readline = require('readline')

class Agent {
    constructor() {

    this.position = "l" // По умолчанию - левая половина поля
    this.run = false // Игра начата
    this.act = null // Действия
    this.rl = readline.createInterface({ // Чтение консоли
    input: process.stdin,
    output: process.stdout
    })
    this.rl.on('line', (input) => { // Обработка строки из консоли
    if(this.run) { // Если игра начата
    // Движения вперед, вправо, влево, удар по мячу
    if("w" == input) this.act = {n: "dash", v: 100}
    if("d" == input) this.act = {n: "turn", v: 20}
    if("a" == input) this.act = {n: "turn", v: -20}
    if("s" == input) this.act = {n: "kick", v: 100}
    }
    })
    }
    msgGot(msg) { // Получение сообщения
    let data = msg.toString('utf8') // Приведение к строке
    this.processMsg(data) // Разбор сообщения
    this.sendCmd() // Отправка команды
    }
    setSocket(socket) { // Настройка сокета
    this.socket = socket
    }
    socketSend(cmd, value) { // Отправка команды
    this.socket.sendMsg(`(${cmd} ${value})`)
    }
    processMsg(msg) { // Обработка сообщения
    let data = Msg.parseMsg(msg) // Разбор сообщения
    if(!data) throw new Error("Parse error\n" + msg)
    // Первое (hear) - начало игры
    if(data.cmd == "hear") this.run = true
    if(data.cmd == "init") this.initAgent(data.p)//Инициализация
    this.analyzeEnv(data.msg, data.cmd, data.p) // Обработка
    }
    initAgent(p) {
    if(p[0] == "r") this.position = "r" // Правая половина поля
    if(p[1]) this.id = p[1] // id игрока
    }
    analyzeEnv(msg, cmd, p) { // Анализ сообщения
    }
    sendCmd() {
    if(this.run) { // Игра начата
    if(this.act) { // Есть команда от игрока
    if(this.act.n == "kick") // Пнуть мяч
    this.socketSend(this.act.n, this.act.v + " 0")
    else // Движение и поворот
    this.socketSend(this.act.n, this.act.v)
    }

    this.act = null // Сброс команды
    }
    }
   }
   module.exports = Agent // Экспорт игрока