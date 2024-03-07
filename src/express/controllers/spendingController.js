const db = require('../../configs/db');
const logger = require('../../configs/logger');



module.exports = {
    getData: async (req, res) => {
        const { token } = req.query;

        try {
            const userId = await db.table.users.getId(token);
            var sql = 'select * from spendinglist where usersId = ? and status = 1';
            var params = [userId];
            const spendingList = await db.query(sql, params);

            res.json({
                spendingList: spendingList
            });
        } catch (err) {
            logger.error(err);
        }
    },

    insertSpendingList: async (req, res) => {
        const { token, namelist, atcreate, status } = req.body;

        try {
            const userId = await db.table.users.getId(token);

            sql = 'insert into spendinglist (usersId, namelist, atcreate, status) values (?, ?, ?, ?)';
            params = [userId, namelist, atcreate, status];
            const result = await db.query(sql, params);

            if (result) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        } catch (err) {
            logger.error(err);
        }
    },

    getSpendingForSpendList: async (req, res) => {
        const { IdList, tblOffset, tbLimit, SearchKey, SearchDate, TypeSearchDate } = req.query;

        try {
            var sql = 'SELECT * FROM spendingitem WHERE spendlistid = ? AND status = 1 ORDER BY Id DESC LIMIT ? OFFSET ?';
            var params = [IdList, tbLimit, tblOffset];

            // Kiểm tra xem có giá trị thời gian không
            if (SearchDate != '') {
                sql = `SELECT * FROM spendingitem WHERE spendlistid = ? AND status = 1 AND 
                    strftime(?, AtUpdate) = ? ORDER BY Id DESC LIMIT ? OFFSET ?`;
                if (TypeSearchDate == 'date') {
                    params = [IdList, '%Y-%m-%d', SearchDate, tbLimit, tblOffset];
                } else {
                    params = [IdList, '%Y-%m', SearchDate, tbLimit, tblOffset];
                }
            }

            const dataResult = await db.query(sql, params);

            // Nếu có từ khoá tìm kiếm
            if (SearchKey != '') {
                // Kiểm tra xem có tìm theo ngày không
                if (SearchDate != '') {
                    sql = `SELECT * FROM spendingitem WHERE spendlistid = ? AND status = 1 AND 
                        (NameItem LIKE ? OR Details LIKE ? OR Price Like ?) AND strftime(?, AtUpdate) = ?
                        ORDER BY Id DESC LIMIT ? OFFSET ?`;

                    // Kiểm tra loại thời gian
                    if (TypeSearchDate == 'date') {
                        params = [IdList, `%${SearchKey}%`, `%${SearchKey}%`, `%${SearchKey}%`, '%Y-%m-%d', SearchDate, tbLimit, tblOffset];
                    } else {
                        params = [IdList, `%${SearchKey}%`, `%${SearchKey}%`, `%${SearchKey}%`, '%Y-%m', SearchDate, tbLimit, tblOffset];
                    }
                } else {
                    // Nếu không có tìm theo ngày thì tìm theo mặt định
                    sql = `SELECT * FROM spendingitem WHERE spendlistid = ? AND status = 1 AND 
                        (NameItem LIKE ? OR Details LIKE ? OR Price Like ?) 
                        ORDER BY Id DESC LIMIT ? OFFSET ?`;
                    params = [IdList, `%${SearchKey}%`, `%${SearchKey}%`, `%${SearchKey}%`, tbLimit, tblOffset];
                }

                const dataResultSearch = await db.query(sql, params);

                res.json({ success: true, data: dataResultSearch });
            } else {
                res.json({ success: true, data: dataResult });
            }
        } catch (err) {
            logger.error(err);
        }
    },

    getListNameSpending: async (req, res) => {
        try {
            var sql = 'SELECT NameItem FROM SpendingItem Where Status = 1';
            const result = await db.query(sql);
            // Xử lý kết quả để lấy danh sách các tên
            const names = result.map(item => item.nameitem);
            res.json({ success: true, data: names });
        } catch (err) {
            logger.error(err);
        }
    },

    insertSpending: async (req, res) => {
        const { ListId, Name, Price, Details, AtCreate, AtUpdate, Status } = req.body;

        try {
            var sql = 'insert into spendingitem (spendlistid, nameitem, price, details, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?, ?)';
            var params = [ListId, Name, Price, Details, AtCreate, AtUpdate, Status];
            const insertResult = await db.query(sql, params);

            if (insertResult) {
                sql = 'select last_insert_rowid() as id'
                const getId = await db.query(sql);

                // Cập nhật thời gian của spendlist
                sql = 'update spendinglist set lastentry = ? where id = ?';
                await db.query(sql, [AtUpdate, ListId]);

                if (getId) {
                    sql = 'select * from spendingitem where id = ?'
                    const selectResult = await db.query(sql, [getId[0].id]);

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
            logger.error(err);
        }
    },

    updateSpending: async (req, res) => {
        const { Id, ListId, Name, Price, Details, AtUpdate } = req.body;

        try {
            var sql = "update spendingitem set spendlistid = ?, nameitem = ?, price = ?, details = ?, atupdate = ? where id = ?";
            var params = [ListId, Name, Price, Details, AtUpdate, Id];
            const result = await db.query(sql, params);
            res.json({ success: result });
        } catch (err) {
            logger.error(err);
        }
    },

    deleteSpending: async (req, res) => {
        const { Id } = req.body;

        try {
            var sql = "update spendingitem set status = 0 where id = ?";
            var params = [Id];
            const result = await db.query(sql, params);
            res.json({ success: result });
        } catch (err) {
            logger.error(err);
        }
    },

    calculateTotalPrice: async (req, res) => {
        try {
            var sql = 'SELECT SUM(Price) AS TotalPrice FROM SpendingItem WHERE Status = 1';
            const result = await db.query(sql);
            res.json({
                success: true,
                data: result[0].totalprice
            })
        } catch (err) {
            logger.error(err);
        }
    },

    calculateItemPrice: async (req, res) => {
        const { SpendName } = req.query;

        try {
            var sql = 'select count(*) as count from spendingitem where NameItem = ? and status = 1';
            var params = [SpendName];
            const countResult = await db.query(sql, params);

            sql = 'select sum(Price) as totalprice from spendingitem where NameItem = ? and status = 1';
            const priceResult = await db.query(sql, params);

            res.json({
                success: true,
                count: countResult[0].count,
                price: priceResult[0].totalprice
            })
        } catch (err) {
            logger.error(err);
        }
    },
}