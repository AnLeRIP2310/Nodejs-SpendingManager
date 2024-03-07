const db = require('../../configs/db')
const logger = require('../../configs/logger')
const myUtils = require('../../configs/myUtils')




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
            const todayResult = await db.query(sql, params);

            // Lấy tổng tiền ngày trước đó
            var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            sql = 'SELECT sum(price) as Total FROM SpendingItem WHERE AtUpdate Like ? AND SpendListId = ?';
            params = [`%${myUtils.formatDateForInput(myUtils.formatDate(yesterday))}%`, spendList];
            const yesterdayResult = await db.query(sql, params);

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
            const thisWeekResult = await db.query(sql, params);

            // Lấy tổng tiền tuần trước đó
            sql = 'SELECT SUM(price) AS Total FROM SpendingItem WHERE AtUpdate >= ? AND AtUpdate < ? AND SpendListId = ?';
            params = [formattedStartOfLastWeek, formattedStartOfThisWeek, spendList];
            const lastWeekResult = await db.query(sql, params);

            // Lấy tổng tiền mỗi ngày
            sql = 'SELECT DATE(AtCreate) AS Date, SUM(Price) AS Total FROM SpendingItem WHERE SpendListId = ? GROUP BY DATE(AtCreate) ORDER BY Date DESC';
            params = [spendList];
            const totalPerDay = await db.query(sql, params);

            // Lấy tổng tiền mỗi khoản chi
            sql = 'SELECT NameItem, SUM(Price) AS TotalPrice FROM SpendingItem WHERE SpendListId = ? GROUP BY NameItem ORDER BY TotalPrice DESC';
            const totalPerSpendItem = await db.query(sql, params);

            res.json({
                success: true,
                today: todayResult[0].total, // Tổng tiền ngày hôm nay
                yesterday: yesterdayResult[0].total, // Tổng tiền ngày hôm qua
                thisWeek: thisWeekResult[0].total, // Tổng tiền tuần hiện tại
                lastWeek: lastWeekResult[0].total, // Tổng tiền tuần trước
                totalPerDay: totalPerDay, // Tổng tiền mỗi ngày
                totalPerSpendItem: totalPerSpendItem, // Tổng tiền mỗi khoán chi
            })

        } catch (error) {
            logger.error(error);
        }
    },
}