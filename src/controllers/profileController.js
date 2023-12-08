const { db, query } = require('../configs/db')

module.exports = {
    getData: async (req, res) => {
        const { token } = req.query;

        try {
            var sql = 'select * from AuthToken where token = ?';
            var params = [token];
            const checkToken = await query(sql, params);

            const UserId = checkToken[0].UsersId;

            sql = 'select * from users where id = ? and status = 1';
            params = [UserId];
            const result = await query(sql, params);
            if (result.length > 0) {
                res.json({ success: true, data: result });
            } else {
                res.json({ success: false })
            }
        } catch (err) {
            console.log(err)
        }
    },

    changePassword: async (req, res) => {
        const { oldPassword, newPassword, token } = req.body

        try {
            var sql = 'select * from AuthToken where token = ?';
            var params = [token];
            const checkToken = await query(sql, params);

            const UserId = checkToken[0].UsersId;

            sql = 'select password from users where (id = ? and password = ?) and status = 1'
            params = [UserId, oldPassword]
            const checkPassword = await query(sql, params)

            if (checkPassword.length > 0) {
                sql = 'update users set password = ? where id = ?'
                params = [newPassword, UserId]
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
            console.log(err)
        }
    }
}