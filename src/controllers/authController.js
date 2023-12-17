const { db, query } = require('../configs/db');
const { v4: uuidv4 } = require('uuid'); // generator token
const crypto = require('crypto');

let urlpage = ''; // Biến global để lưu trữ urlpage

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
                // Kiểm tra authToken và đăng nhập
                const userId = checkUsers[0].Id;
                var token;
                sql = 'select * from authtoken where usersId = ?';
                const checkToken = await query(sql, [userId]);

                if (checkToken.length == 0) {
                    // nếu không có token, tạo token
                    token = crypto.createHash('sha256').update(uuidv4()).digest('hex');
                    sql = 'insert into authtoken (usersId, Token) values (?, ?)';
                    await query(sql, [userId, token]);
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

    urlPage: async (req, res) => {
        const { urlpage: newUrlpage } = req.query;
        urlpage = newUrlpage; // Cập nhật giá trị của biến global
    },

    loginGoogle: async (req, res) => {
        // Lấy thông tin từ Google gửi về
        const user = req.user;
        var googleId = user.id;
        var displayName = user.displayName;
        var email = user.emails[0].value;
        var avatar = user.photos[0].value;
        var token;

        try {
            // Kiểm tra email
            var sql = 'select * from users where Email = ?';
            const checkEmail = await query(sql, [email]);

            if (checkEmail.length > 0) {
                // Email có tồn tại, kiểm tra GoogleId
                sql = 'select * from users where GoogleId = ? and Email = ?';
                const checkGoogleId = await query(sql, [googleId, email]);

                const userId = checkGoogleId[0].Id;

                if (checkGoogleId.length > 0) {
                    // Nếu có GoogleId, tiến hành đăng nhập
                    // Kiểm tra authToken và đăng nhập
                    sql = 'select * from authtoken where usersId = ?';
                    const checkToken = await query(sql, [userId]);

                    if (checkToken.length == 0) {
                        // nếu không có token, tạo token
                        token = crypto.createHash('sha256').update(uuidv4()).digest('hex');
                        sql = 'insert into authtoken (usersId, Token) values (?, ?)';
                        await query(sql, [userId, token]);
                    } else {
                        // Nếu có token
                        token = checkToken[0].Token; // Gán token vào biến
                    }
                } else {
                    // nếu không có googleId, thêm googleId vào tài khoản
                    sql = 'update users set GoogleId = ? where Id = ?';
                    await query(sql, [googleId, userId]);

                    // Kiểm tra authToken và đăng nhập
                    sql = 'select * from authtoken where usersId = ?';
                    const checkToken = await query(sql, [userId]);

                    if (checkToken.length == 0) {
                        // nếu không có token, tạo token
                        token = crypto.createHash('sha256').update(uuidv4()).digest('hex');
                        sql = 'insert into authtoken (usersId, Token) values (?, ?)';
                        await query(sql, [userId, token]);
                    } else {
                        // Nếu có token
                        token = checkToken[0].Token; // Gán token vào biến
                    }
                }
            } else {
                // Email không tồn tại, đăng ký tài khoản
                sql = 'insert into users(GoogleId, Avatar, DisplayName, Email) values (?, ?, ?, ?)';
                await query(sql, [googleId, avatar, displayName, email]);

                // Lấy ra userId
                sql = 'select * from users where Email = ? and GoogleId = ?';
                const checkUsers = await query(sql, [email, googleId]);
                const userId = checkUsers[0].Id;

                // Kiểm tra authToken và đăng nhập
                sql = 'select * from authtoken where usersId = ?';
                const checkToken = await query(sql, [userId]);

                if (checkToken.length == 0) {
                    // nếu không có token, tạo token
                    token = crypto.createHash('sha256').update(uuidv4()).digest('hex');
                    sql = 'insert into authtoken (usersId, Token) values (?, ?)';
                    await query(sql, [userId, token]);
                } else {
                    // Nếu có token
                    token = checkToken[0].Token; // Gán token vào biến
                }
            }

            // đóng cửa sổ đăng nhập, reload lại trang web chính
            res.send(`
                <script>
                    window.opener.postMessage({ message: 'reload', token: '${token}' }, '${urlpage}');
                    window.close();
                </script>`);
        } catch (err) {
            console.log(err)
        }
    },


}


// đang bị lỗi gửi 2 yêu cầu trả về trang web ở phía server