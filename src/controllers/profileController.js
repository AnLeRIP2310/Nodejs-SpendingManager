const { query, getUserId } = require('../configs/db')
const logger = require('../configs/logger')


module.exports = {
    getData: async (req, res) => {
        const { token } = req.query;

        try {
            const userId = await getUserId(token);
            var sql = 'select * from users where id = ? and status = 1';
            var params = [userId];
            const result = await query(sql, params);

            if (result.length > 0) {
                res.json({ success: true, data: result });
            } else {
                res.json({ success: false })
            }
        } catch (err) {
            logger.error(err);
        }
    },

    changePassword: async (req, res) => {
        const { oldPassword, newPassword, token } = req.body

        try {
            const userId = await getUserId(token);

            var sql = 'select password from users where (id = ? and password = ?) and status = 1'
            var params = [userId, oldPassword]
            const checkPassword = await query(sql, params)

            if (checkPassword.length > 0) {
                sql = 'update users set password = ? where id = ?'
                params = [newPassword, userId]
                const result = await query(sql, params)
                if (result) {
                    res.json({ success: true, message: 'Đổi mật khẩu thành công' })
                } else {
                    res.json({ success: false, message: 'Đổi mật khẩu thất bại' })
                }
            } else {
                res.json({ success: false, message: 'Mật khẩu cũ không chính xác' })
            }
        } catch (err) {
            logger.error(err);
        }
    }
}