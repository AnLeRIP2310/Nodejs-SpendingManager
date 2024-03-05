const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');
const appIniConfigs = require('./appIniConfigs');


var db;

// Lấy ra đường dẫn đến tệp database mặt định
var defaultDbPath = path.join(appIniConfigs.getfolderAppConfigs(), 'data', 'SpendingDB.db');

// Lấy đường dẫn database từ tệp cấu hình
var dbPath = appIniConfigs.getIniConfigs('dbPath');
if (dbPath == 'default') { dbPath = defaultDbPath }


// Truy vấn bất đồng bộ với SQLite sử dụng promise
const query = (sql, params) => {
    sql = sql.toLowerCase();
    if (sql.startsWith('select')) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    } else {
        return new Promise((resolve, reject) => {
            db.run(sql, params, (err) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }
};

// Hàm lấy ra userId bằng mã token
async function getUserId(token) {
    try {
        var sql = 'select * from AuthToken where token = ?';
        const checkToken = await query(sql, [token]);
        if (checkToken.length > 0) {
            return checkToken[0].usersid;
        } else {
            return null;
        }
    } catch (err) {
        logger.error(err);
    }
}

// Hàm khởi tạo database và bảng
async function initDB() {
    // Kiểm tra nếu thư mục không tồn tại, thì tạo mới
    if (!fs.existsSync(path.dirname(dbPath))) {
        try {
            fs.mkdirSync(path.dirname(dbPath), { recursive: true });
            console.log('Thư mục đã được tạo.');
        } catch (err) {
            logger.error(err, 'Lỗi khi tạo thư mục');
        }
    }

    // Gán dữ liệu cho biến db
    db = new sqlite3.Database(dbPath);

    const dbExists = fs.existsSync(dbPath);
    if (!dbExists) {
        try {
            await query(`
            CREATE TABLE IF NOT EXISTS Users (
                Id          INTEGER  PRIMARY KEY,
                GoogleId    TEXT,
                FacebookId  TEXT,
                UserName    TEXT     COLLATE NOCASE,
                PassWord    TEXT,
                Avatar      TEXT,
                DisplayName TEXT     COLLATE NOCASE,
                AtCreate    DATETIME,
                Email       TEXT     COLLATE NOCASE,
                Status      INTEGER  DEFAULT 1
            )
        `);

            await query(`
            CREATE TABLE IF NOT EXISTS AuthToken (
                Id      INTEGER PRIMARY KEY,
                UsersId INTEGER REFERENCES Users (Id),
                Token   TEXT
            )
        `);

            await query(`
            CREATE TABLE IF NOT EXISTS SpendingList (
                Id       INTEGER  PRIMARY KEY,
                UsersId  INTEGER  REFERENCES Users (Id),
                NameList TEXT     COLLATE NOCASE,
                AtCreate DATETIME,
                LastEntry DATETIME COLLATE nocase,
                Status   INTEGER  DEFAULT 1
            )
        `);

            await query(`
            CREATE TABLE IF NOT EXISTS SpendingItem (
                Id          INTEGER  PRIMARY KEY,
                SpendListId INTEGER  REFERENCES SpendingList (Id),
                NameItem    TEXT     COLLATE NOCASE,
                Price       REAL     COLLATE NOCASE,
                Details     TEXT     COLLATE NOCASE,
                AtCreate    DATETIME COLLATE NOCASE,
                AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                Status      INTEGER  DEFAULT 1
            )
        `);
        } catch (e) {
            logger.error(e, 'Khởi tạo database thất bại');
        }

    }
}

// Hàm kiểm tra kết nối đến database
function connectDB() {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            logger.error(err, 'Lỗi kết nối đến Database');
        } else {
            console.log('Kết nối đến database thành công.');
        }
    });
}

// Hàm đóng kết nối đến database
function closeDB(callback) {
    if (db) {
        db.close((err) => {
            if (err) {
                logger.error(err, 'Có lỗi khi đóng kết nối database');
            } else {
                console.log('Đã đóng kết nối đến database');
            }

            if (callback) {
                callback();
            }
        });
    }
}


module.exports = { dbPath, defaultDbPath, query, getUserId, initDB, connectDB, closeDB };
