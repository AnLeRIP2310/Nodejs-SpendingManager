const db = require('../../configs/db')
const logger = require('../../configs/logger')



module.exports = {
    getData: async (req, res) => {
        try {
            const { spendList } = req.query;

            if (!spendList || isNaN(spendList))
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' });

            // Lấy tổng tiền ngày hôm nay
            let sql = 'SELECT SUM(price) AS total FROM spendingitem WHERE DATE(atupdate) = DATE(?) AND SpendListId = ? AND status = 1';
            const todayResult = await db.query(sql, ['now', spendList]);

            // Lấy tổng tiền ngày trước đó
            sql = 'SELECT SUM(price) AS total FROM spendingitem WHERE DATE(atupdate) = DATE(?, ?) AND SpendListId = ? AND status = 1';
            const yesterdayResult = await db.query(sql, ['now', '-1 day', spendList]);

            // Lấy tổng tiền tuần hiện tại
            sql = 'SELECT SUM(price) AS total FROM spendingitem WHERE strftime(?, atupdate) = strftime(?, ?) AND SpendListId = ? AND status = 1';
            const thisWeekResult = await db.query(sql, ['%Y-%W', '%Y-%W', 'now', spendList]);

            // Lấy tổng tiền tuần trước đó
            sql = 'SELECT SUM(price) AS total FROM spendingitem WHERE strftime(?, atupdate) = strftime(?, DATE(?, ?)) AND SpendListId = ? AND status = 1';
            const lastWeekResult = await db.query(sql, ['%Y-%W', '%Y-%W', 'now', '-7 days', spendList]);

            // Lấy tổng tiền mỗi khoản chi
            sql = 'SELECT NameItem, SUM(Price) AS TotalPrice FROM SpendingItem WHERE SpendListId = ? AND Status = 1 GROUP BY NameItem ORDER BY TotalPrice DESC';
            const totalPerSpendItem = await db.query(sql, [spendList]);

            // Lấy tổng các khoản chi
            sql = 'SELECT COUNT(DISTINCT NameItem) AS Total FROM SpendingItem WHERE SpendListId = ? AND Status = 1';
            const totalSpendItem = await db.query(sql, [spendList]);

            // Lấy tổng ngày chi
            sql = 'SELECT COUNT(DISTINCT AtUpdate) AS Total FROM SpendingItem WHERE SpendListId = ? AND Status = 1';
            const totalDate = await db.query(sql, [spendList]);

            // Lấy tổng tiền chi
            sql = 'SELECT SUM(Price) AS Total FROM SpendingItem WHERE SpendListId = ? AND Status = 1';
            const totalPrice = await db.query(sql, [spendList]);

            // Lấy các năm
            sql = `SELECT strftime(?, AtUpdate) AS Year FROM SpendingItem WHERE SpendListId = 1 
                AND Status = 1 GROUP BY strftime(?, AtUpdate) ORDER BY strftime(?, AtUpdate) DESC;`
            const yearList = await db.query(sql, ['%Y', '%Y', '%Y']);

            return res.json({
                success: true,
                status: 200,
                message: 'Lấy dữ liệu thành công',
                data: {
                    today: todayResult[0].total, // Tổng tiền ngày hôm nay
                    yesterday: yesterdayResult[0].total, // Tổng tiền ngày hôm qua
                    thisWeek: thisWeekResult[0].total, // Tổng tiền tuần hiện tại
                    lastWeek: lastWeekResult[0].total, // Tổng tiền tuần trước
                    totalPerSpendItem: totalPerSpendItem, // Tổng tiền mỗi khoán chi
                    totalSpendItem: totalSpendItem[0].total, // Tổng các khoản chi
                    totalDate: totalDate[0].total, // Tổng ngày chi
                    totalPrice: totalPrice[0].total, // Tổng tiền chi
                    yearList: yearList, // Lấy các năm
                }
            })
        } catch (error) {
            logger.error(error);
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ', })
        }
    },

    getDataForChart1: async (req, res) => {
        try {
            const { spendListId } = req.query;

            if (!spendListId || isNaN(spendListId))
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' })

            // Lấy tổng tiền mỗi ngày
            let sql = 'SELECT DATE(AtUpdate) AS Date, SUM(Price) AS Total FROM SpendingItem WHERE SpendListId = ? AND Status = 1 GROUP BY DATE(AtUpdate) ORDER BY Date DESC';
            const totalPerDay = await db.query(sql, [spendListId]);

            // Lấy tổng tiền mỗi tuần
            sql = 'SELECT strftime(?, atupdate) AS week, SUM(price) AS total FROM spendingitem WHERE SpendListId = ? AND status = 1 GROUP BY week ORDER BY week DESC';
            const totalPerWeek = await db.query(sql, ['%Y-%W', spendListId]);

            // Lấy tổng tiền mỗi tháng
            sql = 'SELECT strftime(?, atupdate) AS Month, SUM(price) AS Total FROM spendingitem WHERE SpendListId = ? AND status = 1 GROUP BY Month ORDER BY Month DESC';
            const totalPerMonth = await db.query(sql, ['%Y-%m', spendListId]);

            // Lấy tổng tiền mỗi năm
            sql = 'SELECT strftime(?, atupdate) AS year, SUM(price) AS total FROM spendingitem WHERE SpendListId = ? AND status = 1 GROUP BY year ORDER BY year DESC';
            const totalPerYear = await db.query(sql, ['%Y', spendListId]);

            return res.json({
                success: true,
                status: 200,
                message: 'Lấy dữ liệu thành công',
                data: {
                    totalPerDay: totalPerDay,
                    totalPerWeek: totalPerWeek,
                    totalPerMonth: totalPerMonth,
                    totalPerYear: totalPerYear
                }
            });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' })
        }
    },

    getDataForChart2: async (req, res) => {
        try {
            const { type, value, SpendListId } = req.query;

            if (!type && !SpendListId || isNaN(SpendListId))
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' })

            let sql, param, resultData;

            if (value == '' || value == undefined) {
                sql = `SELECT NameItem, SUM(Price) AS TotalPrice FROM SpendingItem WHERE SpendListId = ? AND Status = 1 
                    GROUP BY NameItem ORDER BY TotalPrice DESC`;
                const result = await db.query(sql, [SpendListId])
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

                const result = await db.query(sql, param)
                resultData = result;
            }

            return res.json({ success: true, status: 200, message: 'Lấy dữ liệu thành công', data: resultData })
        } catch (err) {
            logger.error(err);
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" })
        }
    },

    getIncomeData: async (req, res) => {
        try {
            const { spendListId } = req.query;

            if (!spendListId || isNaN(spendListId))
                return res.json({ success: false, status: 400, message: "Dữ liệu yêu cầu không hợp lệ" })

            // Lấy ra thông tin từ bảng income
            let sql = `select * from income where spendlistid = ? order by atcreate`;
            const incomeResult = await db.query(sql, [spendListId]);

            // Tạo mảng chứa dữ liệu
            const incomeData = [];

            let previousPrice = 0; // Biến lưu số tiền đã chi trong tháng

            for (const item of incomeResult) {
                // Tính tổng tiền đã chi trong tháng đó
                sql = `SELECT SUM(price) AS Total FROM spendingitem WHERE strftime(?, atcreate) = strftime(?, ?) AND SpendListId = ? AND status = 1`;
                const totalPrice = await db.query(sql, ['%Y-%m', '%Y-%m', item.atcreate, spendListId])

                // Tính số dư còn lại
                const amountSaved = item.price - totalPrice[0].total;

                // Tính phần trăm tăng/giảm trên các danh sách
                let percent;
                if (incomeData?.length > 0) {
                    percent = ((totalPrice[0].total - previousPrice) / previousPrice) * 100;
                } else {
                    percent = 0
                }

                // Gán số tiền đã chi trong tháng vào biến
                previousPrice = totalPrice[0].total;

                // Đẩy dữ liệu vào mảng
                incomeData.push({
                    id: item.id,
                    atcreate: item.atcreate,
                    price: item.price,
                    percent: percent,
                    saved: amountSaved
                })
            };

            return res.json({ success: true, status: 200, message: 'Lấy dữ liệu thành công', data: incomeData });
        } catch (e) {
            logger.error(e);
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    addIncome: async (req, res) => {
        try {
            const { atcreate, price, spendlistId } = req.body;

            if (isNaN(spendlistId))
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' });

            // Kiểm tra sự tồn tại
            let sql = 'SELECT * FROM income WHERE strftime(?, atcreate) = strftime(?, ?) AND spendlistid = ?';
            const checkResult = await db.query(sql, ['%Y-%m', '%Y-%m', atcreate, spendlistId]);

            if (checkResult?.length > 0) {
                return res.json({ success: true, status: 200, message: 'Thu nhập tháng này đã tồn tại' });
            }

            // Thêm dữ liệu vào bảng
            sql = 'INSERT INTO income (spendlistid , price, atcreate) VALUES (?, ?, ?)';
            await db.query(sql, [spendlistId, price, atcreate])
            return res.json({ success: true, status: 201, message: 'Thêm thu nhập tháng thành công' });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    editIncome: async (req, res) => {
        try {
            const { id, price, atcreate } = req.body;

            if (!id || isNaN(id))
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' });

            let sql = 'UPDATE income SET price = ?, atcreate = ? WHERE id = ?';
            await db.query(sql, [price, atcreate, id])
            return res.json({ success: true, status: 200, message: 'Cập nhật thu nhập tháng thành công' });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    delIncome: async (req, res) => {
        try {
            const { id } = req.body;

            if (!id || isNaN(id))
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' })

            let sql = 'DELETE FROM income WHERE id = ?';
            await db.query(sql, [id])
            return res.json({ success: true, status: 200, message: 'Xoá thu nhập tháng thành công' });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    autoAddIncome: async (req, res) => {
        try {
            const { spendListId } = req.body;

            if (!spendListId || isNaN(spendListId))
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' });

            // Kiểm tra xem có tồn tại dữ liệu trong bảng hay không
            let sql = "SELECT * FROM income";
            const checkData = await db.query(sql);

            if (checkData?.length > 0) {
                // Kiểm tra tháng này đã có dữ liệu chưa
                sql = 'SELECT * FROM income WHERE strftime(?, atcreate) = strftime(?, ?) AND spendlistid = ?';
                const isExists = await db.query(sql, ['%Y-%m', '%Y-%m', new Date().toISOString(), spendListId]);

                // Nếu chưa có thì tiến hành thêm vào
                if (isExists?.length == 0) {
                    // Lấy giá tiền của tháng gần nhất
                    const price = await db.query('SELECT price FROM income ORDER BY atcreate DESC LIMIT 1');

                    // Thêm dữ liệu vào bảng
                    sql = 'INSERT INTO income (spendlistid , price, atcreate) VALUES (?, ?, ?)';
                    await db.query(sql, [spendListId, price[0].price, new Date().toISOString()])
                    return res.json({ success: true, status: 201, message: 'Thêm thu nhập cho tháng này thành công' })
                } else {
                    return res.json({ success: true, status: 200, message: 'Tháng này đã được thêm' });
                }
            }
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },
}