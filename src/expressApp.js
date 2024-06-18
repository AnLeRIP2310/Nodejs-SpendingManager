const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const session = require('express-session');
const db = require('./configs/db')
const passportConfigs = require('./configs/passport')
const app = express()
const path = require('path')
const host = process.env.HOST
const port = process.env.PORT



// Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors());

// Đăng ký và sử dụng Passport trong ứng dụng
app.use(passportConfigs.session())
app.use(passportConfigs.initialize())

// Folder Public 
app.use(express.static(path.join(__dirname, '..', 'public')))

// Router
app.use('/spending', require('./express/routers/spendingRouter'))
app.use('/spendlist', require('./express/routers/spendlistRouter'))
app.use('/auth', require('./express/routers/authRouter'))
app.use('/home', require('./express/routers/homeRouter'))
app.use('/profile', require('./express/routers/profileRouter'))
app.use('/statics', require('./express/routers/staticsRouter'))
app.use('/setting', require('./express/routers/settingRouter'))
app.use('/noted', require('./express/routers/notedRouter'))


let serverInstance; // Tạo biến để lưu trữ instance của server
async function startServer(callback) {
    try {
        // db.connectDB(); // Kiểm tra trạng thái
        await db.initDB(); // Khởi tạo database nếu chưa có db
        serverInstance = app.listen(port, () => {
            console.log(`Server chạy trên http://${host}:${port}`)
            if (callback) {
                callback();
            }
        })
    } catch (error) {
        console.error('Lỗi khi khởi tạo cơ sở dữ liệu:', error)
    }
}

function stopServer(callback) {
    if (serverInstance) {
        serverInstance.close(() => {
            console.log('Server đã đóng');
            if (callback) {
                callback();
            }
        })
    }
}

const expressApp = { startServer, stopServer }

module.exports = expressApp