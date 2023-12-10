const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors');
const app = express()
const path = require('path')
const port = 3962

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors());

// Folder Public 
app.use(express.static(path.join(__dirname, '../public')));

// Router
app.use('/spending', require('./routers/spendingRouter'))
app.use('/auth', require('./routers/authRouter'))
app.use('/home', require('./routers/homeRouter'))
app.use('/profile', require('./routers/profileRouter'))
app.use('/statisc', require('./routers/statiscRouter'))


function startServer(callback) {
    app.listen(port, () => {
        console.log(`Server chạy trên http://localhost:${port}`);
        if (callback) {
            callback();
        }
    });
}

module.exports = { startServer };