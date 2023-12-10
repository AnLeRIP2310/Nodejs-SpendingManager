const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
// const dbPath = path.join(__dirname, '../data/SpendingDB.sqlite');
const dbPath = 'D:/LeThanhAn/Nodejs/SpendingDB.sqlite'

const dbExists = fs.existsSync(dbPath);
const db = new sqlite3.Database(dbPath);

// Truy vấn đồng bộ với SQLite sử dụng promise hỗ trợ (CURD)
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
        var params = [token];
        const checkToken = await query(sql, params);
        if (checkToken.length > 0) {
            return checkToken[0].UsersId;
        } else {
            return null;
        }
    } catch (err) {
        console.log(err)
    }
}

// Hàm tạo bảng async
const createTables = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS Users (
            Id          INTEGER  PRIMARY KEY,
            GoogleId    TEXT     COLLATE NOCASE,
            FacebookId  TEXT     COLLATE NOCASE,
            UserName    TEXT     COLLATE NOCASE,
            PassWord    TEXT     COLLATE NOCASE,
            Avatar      TEXT     COLLATE NOCASE,
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
            Token   TEXT    COLLATE NOCASE
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS SpendingList (
            Id       INTEGER  PRIMARY KEY,
            UsersId  INTEGER  REFERENCES Users (Id),
            NameList TEXT     COLLATE NOCASE,
            AtCreate DATETIME,
            Status   INTEGER  DEFAULT 1
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS SpendingItem (
            Id          INTEGER  PRIMARY KEY,
            SpendListId INTEGER  REFERENCES SpendingList (Id),
            NameItem    TEXT     COLLATE RTRIM,
            Price       REAL,
            Details     TEXT,
            AtCreate    DATETIME,
            AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
            Status      INTEGER  DEFAULT 1
        )
    `);
};

// Kiểm tra nếu cơ sở dữ liệu không tồn tại, gọi hàm tạo bảng
if (!dbExists) {
    createTables();
}

module.exports = { db, query, getUserId };
