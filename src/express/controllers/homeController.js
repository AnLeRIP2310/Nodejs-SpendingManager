const db = require('../../configs/db')
const logger = require('../../configs/logger')
const weather = require('../../configs/openweather');
const axios = require('axios');



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

            return res.json({
                success: true,
                status: 200,
                message: 'Lấy dữ liệu thành công',
                data: {
                    today: todayResult[0].total, // Tổng tiền ngày hôm nay
                    yesterday: yesterdayResult[0].total, // Tổng tiền ngày hôm qua
                    thisWeek: thisWeekResult[0].total, // Tổng tiền tuần hiện tại
                    lastWeek: lastWeekResult[0].total, // Tổng tiền tuần trước
                    totalPerWeek: totalPerWeek, // Tổng tiền mỗi tuần
                    totalPerSpendItem: totalPerSpendItem, // Tổng tiền mỗi khoán chi
                }
            });
        } catch (error) {
            logger.error(error);
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    getCryptoData: async (req, res) => {
        try {
            const symbols = ['BTC', 'ETH', 'BNB', 'USDT', 'SOL', 'XRP', 'DOGE', 'SHIB', 'TON', 'AVAX', 'TRX', 'LTC', 'NEAR', 'DYDX'].join(',');
            const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
                params: {
                    symbol: symbols,
                    convert: 'VND'
                },
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.COINMARKET_API
                }
            });

            return res.json({ success: true, status: 200, message: 'Lấy dữ liệu thành công', data: response.data.data })
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" })
        }
    },

    getWeather: (req, res) => {
        try {
            const { city, lat, lon, lang } = req.query;

            weather.setAPPID(process.env.WEATHER_API);
            weather.setLang(lang);
            weather.delCoordinate();

            if (city) {
                weather.setCity(city);
            } else if (lat && lon) {
                weather.setCoordinate(lat, lon);
            } else {
                weather.setCity("Nha Trang");
            }

            weather.getAllWeather(function (err, JSONObj) {
                return res.json({ success: true, status: 200, message: 'Lấy dữ liệu thành công', data: JSONObj })
            })
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' })
        }
    },
}