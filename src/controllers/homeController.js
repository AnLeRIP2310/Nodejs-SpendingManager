const { db, query } = require('../configs/db')

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function formatDateForInput(dateStr) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${year}-${day}-${month}`;
    }
    return dateStr; // Trả về nguyên bản nếu không thể chuyển đổi
}

// Lấy ngày đầu tiên của tuần
function getStartOfWeek(date) {
    let day = date.getDay();
    let diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

module.exports = {
    getData: async (req, res) => {
        try {
            // Lấy tổng tiền ngày hôm nay
            var sql = 'SELECT sum(price) as Total FROM SpendingItem WHERE AtUpdate Like ?';
            var params = [`%${formatDateForInput(formatDate(new Date()))}%`];
            const todayResult = await query(sql, params);

            // Lấy tổng tiền ngày trước đó
            var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            sql = 'SELECT sum(price) as Total FROM SpendingItem WHERE AtUpdate Like ?';
            params = [`%${formatDateForInput(formatDate(yesterday))}%`];
            const yesterdayResult = await query(sql, params);

            // Lấy tổng tiền tuần này
            let startOfThisWeek = getStartOfWeek(new Date()); // Ngày đầu tiên của tuần hiện tại
            let startOfLastWeek = new Date(startOfThisWeek);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - 7); // Ngày đầu tiên của tuần trước

            // Chuyển đổi ngày thành định dạng phù hợp để truy vấn trong SQL
            let formattedStartOfThisWeek = formatDateForInput(formatDate(startOfThisWeek));
            let formattedStartOfLastWeek = formatDateForInput(formatDate(startOfLastWeek));

            sql = 'SELECT SUM(price) AS Total FROM SpendingItem WHERE AtUpdate >= ?';
            params = [formattedStartOfThisWeek];
            const thisWeekResult = await query(sql, params);

            // Lấy tổng tiền tuần trước
            sql = 'SELECT SUM(price) AS Total FROM SpendingItem WHERE AtUpdate >= ? AND AtUpdate < ?';
            params = [formattedStartOfLastWeek, formattedStartOfThisWeek];
            const lastWeekResult = await query(sql, params);

            // Lấy tổng tiền mỗi ngày
            sql = 'SELECT DATE(AtCreate) AS Date, SUM(Price) AS Total FROM SpendingItem GROUP BY DATE(AtCreate) ORDER BY Date DESC';
            const totalPerDay = await query(sql);

            // Lấy tổng tiền mỗi khoản chi
            sql = 'SELECT NameItem, SUM(Price) AS TotalPrice FROM SpendingItem GROUP BY NameItem ORDER BY TotalPrice DESC';
            const totalPerSpendItem = await query(sql);

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
            console.log(error);
        }
    },
}