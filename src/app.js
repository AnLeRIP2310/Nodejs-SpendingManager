const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const session = require('express-session')
const db = require('./configs/db')
const app = express()
const path = require('path')
const host = process.env.HOST
const port = process.env.PORT



// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors());

// Folder Public 
app.use(express.static(path.join(__dirname, '..', 'public')))

// Router
app.use('/spending', require('./express/routers/spendingRouter'))
app.use('/spendlist', require('./express/routers/spendlistRouter'))
app.use('/auth', require('./express/routers/authRouter'))
app.use('/home', require('./express/routers/homeRouter'))
app.use('/statics', require('./express/routers/staticsRouter'))
app.use('/setting', require('./express/routers/settingRouter'))
app.use('/noted', require('./express/routers/notedRouter'))


app.listen(port, async () => {
    await db.checkVersionsDB(); // Kiểm tra phiên bản db
    await db.initDB(); // Khởi tạo database
    console.log(`Server chạy trên http://${host}:${port}`)
})