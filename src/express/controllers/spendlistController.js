const db = require('../../configs/db')
const logger = require('../../configs/logger')



module.exports = {
    getData: async (req, res) => {
        try {
            var sql = `SELECT spl.*, COALESCE(SUM(sp.price), 0) AS totalprice FROM spendinglist AS spl 
                LEFT JOIN spendingitem AS sp ON spl.id = sp.spendlistid AND sp.status = 1 
                WHERE spl.status = 1 GROUP BY spl.id;`
            const result = await db.query(sql)
            return res.json({ success: true, status: 200, message: "Lấy dữ liệu thành công", data: result })
        } catch (err) {
            logger.error(err);
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    editSpendlist: async (req, res) => {
        try {
            const { Id, SpendName } = req.body

            if (!Id || isNaN(Id))
                return res.json({ success: false, status: 400, message: "Dữ liệu yêu cầu không hợp lệ" });

            // cập nhật danh sách
            await db.query('update SpendingList set NameList = ? where id = ?', [SpendName, Id]);
            return res.json({ success: true, status: 200, message: "Cập nhật danh sách thành công" })
        } catch (err) {
            logger.error(err);
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" })
        }
    },

    delSpendlist: async (req, res) => {
        try {
            const { Id } = req.body

            if (!Id || isNaN(Id))
                return res.json({ success: false, status: 400, message: "Dữ liệu yêu cầu không hợp lệ" })

            // Xoá tất cả item trong list trước khi xoá list
            let sql = "delete from spendingitem where spendlistid = ?";
            await db.query(sql, [Id])

            // Xoá list
            sql = 'delete from SpendingList where id = ?'
            await db.query(sql, [Id])
            return res.json({ success: true, status: 200, message: "Xoá danh sách thành công" })
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" })
        }
    },
}