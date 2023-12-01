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

// Open Server
app.listen(port, () => console.log(`Server chạy trên http://localhost:${port}`));