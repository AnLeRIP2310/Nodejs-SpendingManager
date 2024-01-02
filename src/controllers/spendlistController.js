const { query, getUserId } = require('../configs/db')

module.exports = {
    getData: async (req, res) => {
        const { token } = req.query

        try {
            const userId = await getUserId(token)

            var sql = `SELECT spl.*, SUM(sp.price) as totalprice FROM spendinglist as spl 
                INNER JOIN spendingitem as sp ON spl.id = sp.spendlistid WHERE spl.id = ? 
                and spl.status = ? and sp.status = ?`
            const result = await query(sql, [userId, 1, 1])

            res.json({
                success: true,
                data: result
            })
        } catch (err) {
            console.log(err)
        }
    },

    editSpendlist: async (req, res) => {
        const { Id, SpendName } = req.body

        try {
            var sql = 'update SpendingList set NameList = ? where id = ?'
            var params = [SpendName, Id]
            const result = await query(sql, params)
            res.json({ success: result })
        } catch (err) {
            console.log(err)
        }
    },
}