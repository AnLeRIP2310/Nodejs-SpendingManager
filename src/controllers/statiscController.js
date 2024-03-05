const { query } = require('../configs/db')
const myUtils = require('../configs/myUtils')
const logger = require('../configs/logger')





// Lấy ngày đầu tiên của tuần
function getStartOfWeek(date) {
    let day = date.getDay();
    let diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

module.exports = {
    getData: async (req, res) => {
        const { spendList } = req.query;

        try {
            // Lấy tổng tiền ngày hôm nay
            var sql = 'SELECT sum(price) as Total FROM SpendingItem WHERE AtUpdate Like ? AND SpendListId = ?';
            var params = [`%${myUtils.formatDateForInput(myUtils.formatDate(new Date()))}%`, spendList];
            const todayResult = await query(sql, params);

            // Lấy tổng tiền ngày trước đó
            var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            sql = 'SELECT sum(price) as Total FROM SpendingItem WHERE AtUpdate Like ? AND SpendListId = ?';
            params = [`%${myUtils.formatDateForInput(myUtils.formatDate(yesterday))}%`, spendList];
            const yesterdayResult = await query(sql, params);

            // Lấy tổng tiền tuần này
            let startOfThisWeek = getStartOfWeek(new Date()); // Ngày đầu tiên của tuần hiện tại
            let startOfLastWeek = new Date(startOfThisWeek);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - 7); // Ngày đầu tiên của tuần trước

            // Chuyển đổi ngày thành định dạng phù hợp để truy vấn trong SQL
            let formattedStartOfThisWeek = myUtils.formatDateForInput(myUtils.formatDate(startOfThisWeek));
            let formattedStartOfLastWeek = myUtils.formatDateForInput(myUtils.formatDate(startOfLastWeek));

            // Lấy tổng tiền tuần hiện tại
            sql = 'SELECT SUM(price) AS Total FROM SpendingItem WHERE AtUpdate >= ? AND SpendListId = ?';
            params = [formattedStartOfThisWeek, spendList];
            const thisWeekResult = await query(sql, params);

            // Lấy tổng tiền tuần trước đó
            sql = 'SELECT SUM(price) AS Total FROM SpendingItem WHERE AtUpdate >= ? AND AtUpdate < ? AND SpendListId = ?';
            params = [formattedStartOfLastWeek, formattedStartOfThisWeek, spendList];
            const lastWeekResult = await query(sql, params);

            // Lấy tổng tiền mỗi ngày
            sql = 'SELECT DATE(AtUpdate) AS Date, SUM(Price) AS Total FROM SpendingItem WHERE SpendListId = ? GROUP BY DATE(AtUpdate) ORDER BY Date DESC';
            params = [spendList];
            const totalPerDay = await query(sql, params);

            // Lấy tổng tiền mỗi khoản chi
            sql = 'SELECT NameItem, SUM(Price) AS TotalPrice FROM SpendingItem WHERE SpendListId = ? GROUP BY NameItem ORDER BY TotalPrice DESC';
            const totalPerSpendItem = await query(sql, params);

            // Lấy tổng các khoản chi
            sql = 'SELECT COUNT(DISTINCT NameItem) AS Total FROM SpendingItem WHERE SpendListId = ?';
            const totalSpendItem = await query(sql, params);

            // Lấy tổng ngày chi
            sql = 'SELECT COUNT(DISTINCT AtUpdate) AS Total FROM SpendingItem WHERE SpendListId = ?';
            const totalDate = await query(sql, params);

            // Lấy tổng tiền chi
            sql = 'SELECT SUM(Price) AS Total FROM SpendingItem WHERE SpendListId = ?';
            const totalPrice = await query(sql, params);

            // Lấy các năm
            sql = `SELECT strftime(?, AtUpdate) AS Year FROM SpendingItem WHERE SpendListId = 1 
                AND Status = 1 GROUP BY strftime(?, AtUpdate) ORDER BY strftime(?, AtUpdate) DESC;`
            const yearList = await query(sql, ['%Y', '%Y', '%Y']);

            res.json({
                success: true,
                today: todayResult[0].total, // Tổng tiền ngày hôm nay
                yesterday: yesterdayResult[0].total, // Tổng tiền ngày hôm qua
                thisWeek: thisWeekResult[0].total, // Tổng tiền tuần hiện tại
                lastWeek: lastWeekResult[0].total, // Tổng tiền tuần trước

                totalPerDay: totalPerDay, // Tổng tiền mỗi ngày
                totalPerSpendItem: totalPerSpendItem, // Tổng tiền mỗi khoán chi

                totalSpendItem: totalSpendItem[0].total, // Tổng các khoản chi
                totalDate: totalDate[0].total, // Tổng ngày chi
                totalPrice: totalPrice[0].total, // Tổng tiền chi

                yearList: yearList, // Lấy các năm
            })
        } catch (error) {
            res.json({ success: false, error: error })
            logger.error(error);
        }
    },

    getDataForChart2: async (req, res) => {
        const { type, value, SpendListId } = req.query;

        try {
            var sql, param;
            let resultData;

            if (value == '' || value == undefined) {
                sql = `SELECT NameItem, SUM(Price) AS TotalPrice FROM SpendingItem WHERE SpendListId = ? AND Status = 1 
                    GROUP BY NameItem ORDER BY TotalPrice DESC`;
                const result = await query(sql, [SpendListId])
                resultData = result;
            } else {
                sql = `SELECT NameItem, SUM(Price) AS TotalPrice FROM SpendingItem WHERE SpendListId = ? AND Status = 1 
                    AND strftime(?, AtUpdate) = ? GROUP BY NameItem ORDER BY TotalPrice DESC`;

                if (type === 'date') {
                    param = [SpendListId, '%Y-%m-%d', value];
                } else if (type === 'month') {
                    param = [SpendListId, '%Y-%m', value];
                } else {
                    param = [SpendListId, '%Y', value];
                }

                const result = await query(sql, param)
                resultData = result;
            }

            res.json({
                success: true,
                data: resultData
            })
        } catch (err) {
            logger.error(err);
        }
    },
}