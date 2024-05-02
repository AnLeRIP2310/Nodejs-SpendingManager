const db = require('../../configs/db')
const logger = require('../../configs/logger')



module.exports = {
    getData: async (req, res) => {
        try {
            const { token } = req.query;

            if (!token)
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' });

            const userId = await db.table.users.getId(token);
            const result = await db.query('select * from users where id = ? and status = 1', [userId]);
            return res.json({ success: true, status: 200, message: "Lấy dữ liệu thành công", data: result });
        } catch (err) {
            logger.error(err);
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword, token } = req.body

            if (!token)
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' });

            const userId = await db.table.users.getId(token);

            let sql = 'select password from users where (id = ? and password = ?) and status = 1'
            let params = [userId, oldPassword]
            const checkPassword = await db.query(sql, params)

            if (checkPassword.length > 0) {
                await db.query('update users set password = ? where id = ?', [newPassword, userId])
                return res.json({ success: true, status: 200, message: 'Cập nhật mật khẩu thành công' })
            } else {
                return res.json({ success: false, status: 200, message: 'Mật khẩu cũ không chính xác' })
            }
        } catch (err) {
            logger.error(err);
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    }
}