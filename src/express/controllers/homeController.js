const db = require('../../configs/db')
const logger = require('../../configs/logger')
const myUtils = require('../../configs/myUtils')
const weather = require('../../configs/openweather');



module.exports = {
    getData: async (req, res) => {
        try {
            // Lấy tổng tiền ngày hôm nay
            var sql = 'SELECT sum(price) as Total FROM SpendingItem WHERE AtUpdate Like ? AND Status = 1';
            var params = [`%${myUtils.formatDateForInput(myUtils.formatDate(new Date()))}%`];
            const todayResult = await db.query(sql, params);

            // Lấy tổng tiền ngày trước đó
            var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            sql = 'SELECT sum(price) as Total FROM SpendingItem WHERE AtUpdate Like ? AND Status = 1';
            params = [`%${myUtils.formatDateForInput(myUtils.formatDate(yesterday))}%`];
            const yesterdayResult = await db.query(sql, params);

            // Lấy tổng tiền tuần này
            let startOfThisWeek = myUtils.getStartOfWeek(new Date()); // Ngày đầu tiên của tuần hiện tại
            let startOfLastWeek = new Date(startOfThisWeek);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - 7); // Ngày đầu tiên của tuần trước

            // Chuyển đổi ngày thành định dạng phù hợp để truy vấn trong SQL
            let formattedStartOfThisWeek = myUtils.formatDateForInput(myUtils.formatDate(startOfThisWeek));
            let formattedStartOfLastWeek = myUtils.formatDateForInput(myUtils.formatDate(startOfLastWeek));

            // Lấy tổng tiền tuần hiện tại
            sql = 'SELECT SUM(price) AS Total FROM SpendingItem WHERE AtUpdate >= ? AND Status = 1';
            const thisWeekResult = await db.query(sql, [formattedStartOfThisWeek]);

            // Lấy tổng tiền tuần trước đó
            sql = 'SELECT SUM(price) AS Total FROM SpendingItem WHERE AtUpdate >= ? AND AtUpdate < ? AND Status = 1';
            params = [formattedStartOfLastWeek, formattedStartOfThisWeek];
            const lastWeekResult = await db.query(sql, params);

            // Lấy tổng tiền mỗi ngày
            sql = 'SELECT DATE(AtCreate) AS Date, SUM(Price) AS Total FROM SpendingItem WHERE Status = 1 GROUP BY DATE(AtCreate) ORDER BY Date DESC';
            const totalPerDay = await db.query(sql);

            // Lấy tổng tiền mỗi khoản chi
            sql = 'SELECT NameItem, SUM(Price) AS TotalPrice FROM SpendingItem WHERE Status = 1 GROUP BY NameItem ORDER BY TotalPrice DESC';
            const totalPerSpendItem = await db.query(sql);

            // Lấy tổng tiền mỗi tuần
            sql = `select strftime(?, atcreate) AS week, SUM(price) AS totalprice FROM spendingitem WHERE status = 1 GROUP BY week ORDER BY week desc`;
            const totalPerWeek = await db.query(sql, ['%Y-%W']);

            res.json({
                success: true,
                today: todayResult[0].total, // Tổng tiền ngày hôm nay
                yesterday: yesterdayResult[0].total, // Tổng tiền ngày hôm qua
                thisWeek: thisWeekResult[0].total, // Tổng tiền tuần hiện tại
                lastWeek: lastWeekResult[0].total, // Tổng tiền tuần trước
                totalPerDay: totalPerDay, // Tổng tiền mỗi ngày
                totalPerWeek: totalPerWeek, // Tổng tiền mỗi tuần
                totalPerSpendItem: totalPerSpendItem, // Tổng tiền mỗi khoán chi
            });
        } catch (error) {
            logger.error(error);
        }
    },

    getWeather: (req, res) => {
        try {
            const { city, lat, lon } = req.query;

            weather.setAPPID(process.env.WEATHER_API);
            weather.setLang('vi');
            weather.delCoordinate();

            if (city) {
                weather.setCity(city);
            } else if (lat && lon) {
                weather.setCoordinate(lat, lon);
            } else {
                weather.setCity("Nha Trang");
            }

            weather.getAllWeather(function (err, JSONObj) {
                if (JSONObj) {
                    res.json({ success: true, data: JSONObj, message: 'Lấy dữ liệu thời tiết thành công' })
                } else {
                    res.json({ success: false, message: 'Lấy dữ liệu thời tiết thất bại' })
                }
            })
        } catch (e) {
            logger.error(e)
            res.json({ success: false, message: 'Có lỗi khi lấy dữ liệu thời tiết' })
        }
    },
}