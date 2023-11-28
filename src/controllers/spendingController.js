const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./src/data/SpendingDB.sqlite');


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
    getData: async (req, res) => {
        var sql = 'select * from spendinglist where status = 1';
        const spendingList = await query(sql);
        console.log(spendingList);
        res.json({
            spendingList: spendingList
        });
    },

    insertSpendingList: async (req, res) => {
        const { namelist, atcreate, status } = req.body;

        try {
            var sql = 'insert into spendinglist (namelist, atcreate, status) values (?, ?, ?)';
            var params = [namelist, atcreate, status];
            const result = await query(sql, params);
            res.json({ success: result });
        } catch (err) {
            console.error(err);
        }
    },
}