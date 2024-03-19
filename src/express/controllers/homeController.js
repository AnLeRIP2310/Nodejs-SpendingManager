const db = require('../../configs/db')
const logger = require('../../configs/logger')
const myUtils = require('../../configs/myUtils')
const weather = require('../../configs/openweather');



module.exports = {
    getData: async (req, res) => {
        try {
            // Lấy tổng tiền ngày hôm nay
            let sql = 'SELECT SUM(price) AS total FROM spendingitem WHERE DATE(atupdate) = DATE(?) AND status = 1';
            const todayResult = await db.query(sql, ['now']);

            // Lấy tổng tiền ngày trước đó
            sql = 'SELECT SUM(price) AS total FROM spendingitem WHERE DATE(atupdate) = DATE(?, ?) AND status = 1';
            const yesterdayResult = await db.query(sql, ['now', '-1 day']);

            // Lấy tổng tiền tuần hiện tại
            sql = 'SELECT SUM(price) AS total FROM spendingitem WHERE strftime(?, atupdate) = strftime(?, ?) AND status = 1';
            const thisWeekResult = await db.query(sql, ['%Y-%W', '%Y-%W', 'now']);

            // Lấy tổng tiền tuần trước đó
            sql = 'SELECT SUM(price) AS total FROM spendingitem WHERE strftime(?, atupdate) = strftime(?, DATE(?, ?)) AND status = 1';
            const lastWeekResult = await db.query(sql, ['%Y-%W', '%Y-%W', 'now', '-7 days']);

            // Lấy tổng tiền mỗi khoản chi
            sql = 'SELECT NameItem, SUM(Price) AS TotalPrice FROM SpendingItem WHERE Status = 1 GROUP BY NameItem ORDER BY TotalPrice DESC';
            const totalPerSpendItem = await db.query(sql);

            // Lấy tổng tiền mỗi tuần
            sql = `select strftime(?, atupdate) AS week, SUM(price) AS totalprice FROM spendingitem WHERE status = 1 GROUP BY week ORDER BY week desc`;
            const totalPerWeek = await db.query(sql, ['%Y-%W']);

            res.json({
                success: true,
                today: todayResult[0].total, // Tổng tiền ngày hôm nay
                yesterday: yesterdayResult[0].total, // Tổng tiền ngày hôm qua
                thisWeek: thisWeekResult[0].total, // Tổng tiền tuần hiện tại
                lastWeek: lastWeekResult[0].total, // Tổng tiền tuần trước
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