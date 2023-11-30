const sqlite3 = require('sqlite3').verbose()
// const db = new sqlite3.Database('./src/data/SpendingDB.sqlite');
const db = new sqlite3.Database('D:/LeThanhAn/Nodejs/SpendingDB.sqlite')

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

    getSpendingForSpendList: async (req, res) => {
        const { IdList, tblOffset, tbLimit } = req.body;

        try {
            var sql = 'SELECT * FROM spendingitem WHERE spendlistid = ? AND status = 1 ORDER BY Id DESC LIMIT ? OFFSET ?';
            var params = [IdList, tbLimit, tblOffset];
            const result = await query(sql, params);
            res.json({
                success: true,
                data: result
            });

        } catch (err) {
            console.error(err);
        }
    },

    insertSpending: async (req, res) => {
        const { ListId, Name, Price, Details, AtCreate, AtUpdate, Status } = req.body;

        try {
            var sql = 'insert into spendingitem (spendlistid, nameitem, price, details, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?, ?)';
            var params = [ListId, Name, Price, Details, AtCreate, AtUpdate, Status];
            const insertResult = await query(sql, params);

            if (insertResult) {
                sql = 'select last_insert_rowid() as id'
                const getId = await query(sql);

                if (getId) {
                    sql = 'select * from spendingitem where id = ?'
                    const selectResult = await query(sql, [getId[0].id]);

                    res.json({
                        success: insertResult,
                        data: selectResult
                    });
                }
            } else {
                res.json({
                    success: false
                });
            }
        } catch (err) {
            console.error(err);
        }
    },

    updateSpending: async (req, res) => {
        const { Id, ListId, Name, Price, Details, AtUpdate } = req.body;

        try {
            var sql = "update spendingitem set spendlistid = ?, nameitem = ?, price = ?, details = ?, atupdate = ? where id = ?";
            var params = [ListId, Name, Price, Details, AtUpdate, Id];
            const result = await query(sql, params);
            res.json({ success: result });
        } catch (err) {
            console.log(err);
        }
    },

    deleteSpending: async (req, res) => {
        const { Id } = req.body;

        try {
            var sql = "update spendingitem set status = 0 where id = ?";
            var params = [Id];
            const result = await query(sql, params);
            res.json({ success: result });
        } catch (err) {
            console.log(err);
        }
    },

    calculateTotalPrice: async (req, res) => {
        try {
            var sql = 'SELECT SUM(Price) AS TotalPrice FROM SpendingItem WHERE Status = 1';
            const result = await query(sql);
            res.json({
                success: true,
                data: result[0].totalprice
            })
        } catch (err) {
            console.log(err);
        }
    },

    calculateItemPrice: async (req, res) => {
        const { SpendName} = req.query;

        try {
            var sql = 'select count(*) as count from spendingitem where NameItem = ? and status = 1';
            var params = [SpendName];
            const countResult = await query(sql, params);
            
            sql = 'select sum(Price) as totalprice from spendingitem where NameItem = ? and status = 1';
            const priceResult = await query(sql, params);

            res.json({
                success: true,
                count: countResult[0].count,
                price: priceResult[0].totalprice
            })
        } catch (err) {
            console.log(err);
        }
        console.log(SpendName);
    },
}