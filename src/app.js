const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors');
const session = require('express-session');
const { initDB, connectDB } = require('./configs/db');
const passportConfigs = require('./configs/passport')
const app = express()
const path = require('path')
const host = 'localhost'
const port = 3962

// Middleware
app.use(session({
    secret: 'spendingmanager',
    resave: false,
    saveUninitialized: false
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors());

// Đăng ký và sử dụng Passport trong ứng dụng
app.use(passportConfigs.session());
app.use(passportConfigs.initialize());

// Folder Public 
app.use(express.static(path.join(__dirname, '../public')));

// Router
app.use('/spending', require('./routers/spendingRouter'))
app.use('/auth', require('./routers/authRouter'))
app.use('/home', require('./routers/homeRouter'))
app.use('/profile', require('./routers/profileRouter'))
app.use('/statisc', require('./routers/statiscRouter'))


app.listen(port, async () => {
    await initDB(); // Khởi tạo database
    // connectDB(); // Kiểm tra kết nối db
    console.log(`Server chạy trên http://${host}:${port}`);
})