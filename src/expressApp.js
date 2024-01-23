const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const session = require('express-session');
const { initDB, connectDB } = require('./configs/db')
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
app.use(express.static(path.join(__dirname, '../public')))

// Router
app.use('/spending', require('./routers/spendingRouter'))
app.use('/spendlist', require('./routers/spendlistRouter'))
app.use('/auth', require('./routers/authRouter'))
app.use('/home', require('./routers/homeRouter'))
app.use('/profile', require('./routers/profileRouter'))
app.use('/statisc', require('./routers/statiscRouter'))
app.use('/setting', require('./routers/settingRouter'))


let serverInstance; // Tạo biến để lưu trữ instance của server
async function startServer(callback) {
    try {
        await initDB(); // Khởi tạo database nếu chưa có db
        connectDB(); // Kiểm tra trạng thái
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

module.exports = { startServer, stopServer }