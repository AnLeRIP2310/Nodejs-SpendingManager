const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const session = require('express-session')
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
app.use('/statisc', require('./express/routers/statiscRouter'))
app.use('/setting', require('./express/routers/settingRouter'))
app.use('/noted', require('./express/routers/notedRouter'))


app.listen(port, async () => {
    await db.initDB(); // Khởi tạo database
    console.log(`Server chạy trên http://${host}:${port}`)
})