const { db, query } = require('../configs/db');

module.exports = {
    register: async (req, res) => {
        const { username, password } = req.body;

        try {
            var sql = 'select * from users where username = ?';
            var params = [username];
            const checkIsExist = await query(sql, params);

            if (checkIsExist.length != 0) {
                res.json({ success: false, message: 'Tài khoản đã tồn tại' });
            } else {
                sql = 'insert into users (username, password) values (?, ?)';
                params = [username, password];
                const result = await query(sql, params);
                res.json({ success: result, message: 'Đăng ký thành công' });
            }
        } catch (err) {
            console.error(err);
        }
    },

    login: async (req, res) => {
        const { username, password } = req.query;

        try {
            var sql = 'select * from users where username = ? and password = ?';
            var params = [username, password];
            const result = await query(sql, params);

            if (result.length > 0) {
                res.json({ success: true });
            }
        } catch (err) {
            console.error(err);
        }
    },
}