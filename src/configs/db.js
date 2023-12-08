const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./src/data/SpendingDB.sqlite');
// const db = new sqlite3.Database('D:/LeThanhAn/Nodejs/SpendingDB.sqlite')

// truy vấn đồng bộ với sqlite sử dụng promise hỗ trợ (CURD)
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
}

module.exports = { db, query };