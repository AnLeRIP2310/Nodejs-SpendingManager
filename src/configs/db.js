const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { logError } = require('./logError');
const appSettings = require('./appSettings')


var db;

// Kiểm tra và gán giá trị phù hợp dựa vào hệ điều hành
var defaultDbPath;
if (process.platform == 'win32') { defaultDbPath = process.env.USERPROFILE + '/Documents/SpendingManager/data/SpendingDB.db'; }
else if (process.platform == 'darwin') { defaultDbPath = process.env.HOME + '/Documents/SpendingManager/data/SpendingDB.db'; }

// Lấy đường dẫn database từ tệp cấu hình
var dbPath = appSettings.parseIni(fs.readFileSync(appSettings.iniFilePath, 'utf8')).Data.dbPath;
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
        console.log(err)
        logError(err);
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
            console.log('Lỗi khi tạo thư mục:', err);
            logError(err);
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
            console.log('Khởi tạo database thất bại:', e);
            logError(e);
        }

    }
}

// Hàm kiểm tra kết nối đến database
function connectDB() {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Lỗi kết nối đến database:', err.message);
            logError(err);
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
                console.error('Có lỗi khi đóng kết nối database:', err.message);
                logError(err);
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
