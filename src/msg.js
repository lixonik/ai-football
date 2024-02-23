export class Message {
    static parseMsg(msg) { // Разбор сообщения
        if (msg.endsWith('\u0000')) // Удаление символа в конце
            msg = msg.substring(0, msg.length - '\u0000'.length)
        // Разбор сообщения
        let array = msg.match(/(\(|[-\d\.]+|[\\\"\w]+|\))/g)
        let res = { msg, p: [] } // Результирующее сообщение
        // Анализировать с индекса 0, результат в res
        Message.#parse(array, 0, res)
        Message.#makeCmd(res) // Выделить команду
        return res
    }

    static #parse(array, index, res) { // Разбор сообщения в скобках
        // Всегда с открывающей скобки
        if (array[index] !== '(')
            return
        index++
        // Разбор внутри скобок
        Message.#parseInner(array, index, res)
    }

    static #parseInner(array, index, res) {
        // Пока не встретится закрывающая скобка
        while (array[index] !== ')') {
            // Если внутри еще одна скобка
            if (array[index] === '(') {
                let r = { p: [] }
                // Рекурсивный вызов с index
                Message.#parse(array, index, r)
                res.p.push(r)
            } else {
                // Одиночный параметр
                let num = parseFloat(array[index])
                res.p.push(isNaN(num) ? array[index] : num)
                index++
            }
        }
        index++
    }

    static #makeCmd(res) { // Выделение команды
        if (res.p && res.p.length > 0) {
            // Первый параметр - команда
            res.cmd = res.p.shift()
            // Выделить команды у параметров
            res.p.forEach(value => Message.#makeCmd(value))
        }
    }
}
