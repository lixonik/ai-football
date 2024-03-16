module.exports = {
    roundToHund(num) {
        return Math.round(num * 100) / 100.0 // rounding to hundredths
    },

    normalize(p1, p2) {
        let v = {
            x: p2.x - p1.x,
            y: p2.y - p1.y,
        }
        let len = Math.sqrt(v.x ** 2 + v.y ** 2)
        v.x /= len
        v.y /= len
        return v
    },

    do180(angle) {
        while (angle > 180 || angle < -180)
        {
            if (angle > 180)
                angle -= 360
            if (angle < -180)
                angle += 360
        }
        return angle
    }
}
