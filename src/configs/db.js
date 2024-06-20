require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const sqlite3 = require('@journeyapps/sqlcipher').verbose();
const appIniConfigs = require('./appIniConfigs');
const logger = require('./logger');
const path = require('path');
const fs = require('fs');
const encryptionKey = process.env.DB_ENCRYP_KEY;



let database;
let isConnected = false;
let pathToDb = appIniConfigs.getIniConfigs('dbPath');
const defPathToDb = path.join(appIniConfigs.getfolderAppConfigs(), 'data', 'SpendingDB.db');

// Kiểm tra và gán đường dẫn db từ tệp .ini
if (pathToDb == 'default') { pathToDb = defPathToDb; }


/**
 * Thực hiện một truy vấn SQL với các tham số tùy chọn.
 * 
 * @param {string} sql - Truy vấn SQL cần thực hiện.
 * @param {Array} params - Các tham số sẽ được sử dụng trong truy vấn.
 * @returns {Promise} - Một promise sẽ được resolve với kết quả của truy vấn hoặc reject với lỗi.
 * 
 * @example
 * // Sử dụng truy vấn select
 * const rows = await db.query('SELECT * FROM users', []);
 * 
 * // Sử dụng truy vấn khác
 * const result = db.await query('UPDATE users SET active = 1', []);
 */
function query(sql, params) {
    sql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    if (sql.startsWith('select')) {
        return new Promise((resolve, reject) => {
            database.all(sql, params, (err, rows) => {
                if (err) { reject(err) }
                else { resolve(rows) }
            });
        });
    } else {
        return new Promise((resolve, reject) => {
            database.run(sql, params, (err) => {
                if (err) { reject(err) }
                else {
                    resolve({ success: true })
                }
            });
        });
    }
};


/**
 * Gọi phương thức này để khởi tạo kết nối đến database và tạo các bảng nếu chưa tồn tại
 * 
 * @example
 * // Gọi hàm
 * await db.initDB();
 */
async function initDB() {
    try {
        // Tạo mới thư mục nếu không tồn tại
        if (!fs.existsSync(path.dirname(pathToDb))) {
            fs.mkdirSync(path.dirname(pathToDb), { recursive: true });
        }

        // Khởi tạo database
        if (!isConnected) {
            database = new sqlite3.Database(pathToDb, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    logger.error(err, "Kết nối database thất bại");
                } else {
                    database.run('PRAGMA cipher_compatibility = 4');
                    database.run(`PRAGMA key = '${encryptionKey}'`);
                    isConnected = true;
                    console.log('Kết nối đến database thành công')
                }
            });
        }

        await query(`
            CREATE TABLE IF NOT EXISTS AppLock (
                Id          INTEGER  PRIMARY KEY,
                Password    TEXT,
                AtCreate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                Status      INTEGER  DEFAULT 1
            )
        `);

        // Tạo các bảng
        await query(`
            CREATE TABLE IF NOT EXISTS SpendingList (
                Id          INTEGER  PRIMARY KEY,
                NameList    TEXT     COLLATE NOCASE,
                AtCreate    DATETIME,
                AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                LastEntry   DATETIME,
                Status      INTEGER  DEFAULT 1
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS SpendingItem (
                Id          INTEGER  PRIMARY KEY,
                SpendListId INTEGER  REFERENCES SpendingList (Id),
                NameItem    TEXT     COLLATE NOCASE,
                Price       REAL     DEFAULT 0,
                Details     TEXT     COLLATE NOCASE,
                AtCreate    DATETIME,
                AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                Status      INTEGER  DEFAULT 1
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS Noted (
                Id          INTEGER  PRIMARY KEY,
                NameList    TEXT     COLLATE nocase,
                Content     TEXT     COLLATE nocase,
                AtCreate    DATETIME,
                AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                Status      INTEGER  DEFAULT 1
            );   
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS Income (
                Id          INTEGER  PRIMARY KEY,
                SpendListId INTEGER  REFERENCES SpendingList (Id),
                Price       REAL     DEFAULT 0,
                AtCreate    DATETIME,
                AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                Status      INTEGER  DEFAULT 1
            )
        `);
    } catch (e) {
        logger.error(e, 'Khởi tạo database thất bại');
    }
}

/**
 * Tạo hoặc kiểm tra kết nối đến cơ sở dữ liệu SQLite.
 *
 * @example
 * // Kết nối hoặc kiểm tra kết nối đến cơ sở dữ liệu
 * db.connectDB();
 */
function connectDB() {
    try {
        if (!isConnected) {
            database = new sqlite3.Database(pathToDb, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    logger.error(err, "Kết nối database thất bại");
                } else {
                    database.run('PRAGMA cipher_compatibility = 4');
                    database.run(`PRAGMA key = '${encryptionKey}'`);
                    isConnected = true;
                    console.log('Kết nối đến database thành công')
                }
            });
        } else {
            console.log('Đã có kết nối đến database')
        }
    } catch (e) {
        logger.error(e, 'Lỗi kết nối đến database');
    }
}


/**
 * Đóng kết nối đến cơ sở dữ liệu SQLite.
 * @param {Function} [callback] - Hàm callback được gọi sau khi đóng kết nối (nếu được cung cấp).
 *
 * @example
 * // Đóng kết nối đến cơ sở dữ liệu và không sử dụng callback
 * db.closeDB();
 *
 * // Đóng kết nối đến cơ sở dữ liệu và sử dụng callback
 * db.closeDB(() => {
 *    console.log('Kết nối đã được đóng.');
 * });
 */
function closeDB(callback) {
    try {
        if (isConnected) {
            database.close();
            isConnected = false;
            console.log('Đã đóng kết nối đối database');
        } else {
            console.log('Chưa có kết nối đến database')
        }

        if (callback) { callback() };
    } catch (e) {
        logger.error(e, 'Có lỗi khi đóng kết nối database');
    }
}


/**
 * Lấy giá trị ID của bản ghi được chèn gần đây nhất trong cơ sở dữ liệu.
 * @returns {Promise<number>} Giá trị ID của bản ghi được chèn gần đây nhất.
 *
 * @example
 * // Gọi hàm lastInsertId để lấy Id được chèn gần nhất
 * await db.lastInsertId();
 */
async function lastInsertId() {
    try {
        const lastId = await query('select last_insert_rowid() as id')
        return lastId[0].id
    } catch (e) {
        logger.error(e)
    }
}

const dbPath = {
    /**
     * Lấy đường dẫn đến cơ sở dữ liệu hiện tại.
     * @returns {string} Đường dẫn đến cơ sở dữ liệu hiện tại.
     *
     * @example
     * // Sử dụng hàm get để lấy đường dẫn đến cơ sở dữ liệu
     * const currentPath = db.dbPath.get();
     * console.log('Đường dẫn đến database:', currentPath);
     */
    get: () => pathToDb,
    /**
     * Lấy đường dẫn đến cơ sở dữ liệu mặc định.
     * @returns {string} Đường dẫn đến cơ sở dữ liệu mặc định.
     *
     * @example
     * // Sử dụng hàm getDefault để lấy đường dẫn đến cơ sở dữ liệu mặc định
     * const defaultPath = db.dbPath.getDefault();
     * console.log('Đường dẫn đến database mặc định:', defaultPath);
     */
    getDefault: () => defPathToDb
}


const db = {
    query,
    initDB,
    closeDB,
    connectDB,
    lastInsertId,
    dbPath
}

module.exports = db