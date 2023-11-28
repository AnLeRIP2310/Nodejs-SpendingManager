const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./src/data/SpendingDB.db');


// truy vấn đồng bộ với sqlite sử dụng promise
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


module.exports = {
    index: async (req, res) => {

    }
}