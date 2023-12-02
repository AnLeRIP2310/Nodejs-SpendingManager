const { db, query } = require('../configs/db');
const { v4: uuidv4 } = require('uuid'); // generator token
const crypto = require('crypto');

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
            const checkUsers = await query(sql, params);

            if (checkUsers.length > 0) {
                sql = 'select * from authtoken where usersId = ?';
                params = [checkUsers[0].Id];
                const checkToken = await query(sql, params);

                var token;

                if (checkToken.length == 0) {
                    // nếu không có token, tạo token
                    token = crypto.createHash('sha256').update(uuidv4()).digest('hex');
                    sql = 'insert into authtoken (usersId, Token) values (?, ?)';
                    params = [checkUsers[0].Id, token];
                    await query(sql, params);
                } else {
                    // Nếu có token
                    token = checkToken[0].Token; // Gán token vào biến
                }

                res.json({ success: true, token: token });
            } else {
                res.json({ success: false });
            }
        } catch (err) {
            console.error(err);
        }
    },

    checkToken: async (req, res) => {
        const { token } = req.query;

        try {
            var sql = 'select * from authtoken where Token = ?';
            var params = [token];
            const checkToken = await query(sql, params);

            if (checkToken.length > 0) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        } catch (err) {
            console.error(err);
        }
    },
}