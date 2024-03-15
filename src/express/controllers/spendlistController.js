const db = require('../../configs/db')
const logger = require('../../configs/logger')



module.exports = {
    getData: async (req, res) => {
        const { token } = req.query

        try {
            const userId = await db.table.users.getId(token);

            var sql = `SELECT spl.*, COALESCE(SUM(sp.price), 0) AS totalprice FROM spendinglist AS spl 
                LEFT JOIN spendingitem AS sp ON spl.id = sp.spendlistid AND sp.status = 1 
                WHERE spl.usersid = ? AND spl.status = 1 GROUP BY spl.id;`
            const result = await db.query(sql, [userId])

            res.json({
                success: true,
                data: result
            })
        } catch (err) {
            logger.error(err)
        }
    },

    editSpendlist: async (req, res) => {
        const { Id, SpendName } = req.body

        try {
            var sql = 'update SpendingList set NameList = ? where id = ?'
            var params = [SpendName, Id]
            const result = await db.query(sql, params)

            console.log(result);
            res.json({ success: true })
        } catch (err) {
            logger.error(err)
        }
    },

    delSpendlist: async (req, res) => {
        const { Id } = req.body

        try {
            var sql = 'update SpendingList set status = 0 where id = ?'
            const result = await db.query(sql, [Id])
            res.json({ success: true })
        } catch (e) {
            logger.error(e)
        }
    },
}