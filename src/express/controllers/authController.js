const ipc = require('node-ipc');
const fs = require('fs');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { query } = require('../../configs/db');
const logger = require('../../configs/logger');
const appIniConfigs = require('../../configs/appIniConfigs');
const myUtils = require('../../configs/myUtils');



// Cấu hình IPC
ipc.config.id = 'express';
ipc.config.retry = 1500;
ipc.config.silent = true;



let urlpage = ''; // Biến global để lưu trữ urlpage


var pathSettingFolder;
if (process.platform === 'win32') { pathSettingFolder = process.env.USERPROFILE + '/Documents/SpendingManager/'; }
else if (process.platform === 'darwin') { pathSettingFolder = process.env.HOME + '/Documents/SpendingManager/'; }


// Khởi tạo OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    process.env.GG_DRIVE_CLIENT_ID,
    process.env.GG_DRIVE_CLIENT_SECRET,
    process.env.GG_DRIVE_REDIRECT_URI
);



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
            logger.error(err);
        }
    },

    login: async (req, res) => {
        const { username, password } = req.query;
        var token;

        try {
            var sql = 'select * from users where username = ? and password = ?';
            const checkUsers = await query(sql, [username, password]);

            if (checkUsers.length > 0) {
                // Kiểm tra authToken và đăng nhập
                const userId = checkUsers[0].id;

                sql = 'select * from authtoken where usersId = ?';
                const checkToken = await query(sql, [userId]);

                if (checkToken.length > 0) {
                    // Nếu có token
                    token = checkToken[0].token; // Gán token vào biến
                } else {
                    // nếu không có token, tạo token
                    token = crypto.createHash('sha256').update(uuidv4()).digest('hex');
                    sql = 'insert into authtoken (usersId, Token) values (?, ?)';
                    await query(sql, [userId, token]);
                }

                res.json({ success: true, token: token });
            } else {
                res.json({ success: false });
            }
        } catch (err) {
            logger.error(err);
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
            logger.error(err);
        }
    },

    urlPage: (req, res) => {
        const { urlpage: newUrlpage } = req.query;
        urlpage = newUrlpage; // Cập nhật giá trị của biến global
    },

    loginGoogle: async (req, res) => {
        // Lấy thông tin từ Google gửi về
        const user = req.user;
        const googleId = user.id;
        const displayName = user.displayName;
        const email = user.emails[0].value;
        const avatar = user.photos[0].value;
        var token;

        try {
            // Kiểm tra email
            var sql = 'select * from users where Email = ?';
            const checkEmail = await query(sql, [email]);

            if (checkEmail.length > 0) {
                // Email có tồn tại, kiểm tra GoogleId
                sql = 'select * from users where GoogleId = ? and Email = ?';
                const checkGoogleId = await query(sql, [googleId, email]);

                const userId = checkGoogleId[0].id;

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
                        token = checkToken[0].token; // Gán token vào biến
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
                        token = checkToken[0].token; // Gán token vào biến
                    }
                }
            } else {
                // Email không tồn tại, đăng ký tài khoản
                sql = 'insert into users(GoogleId, Avatar, DisplayName, Email) values (?, ?, ?, ?)';
                await query(sql, [googleId, avatar, displayName, email]);

                // Lấy ra userId
                sql = 'select * from users where Email = ? and GoogleId = ?';
                const checkUsers = await query(sql, [email, googleId]);
                const userId = checkUsers[0].id;

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
                    token = checkToken[0].token; // Gán token vào biến
                }
            }

            // Gửi thông điệp đến electron
            ipc.connectTo('electron', () => {
                ipc.of.electron.on('connect', () => {
                    // Gửi đến electron
                    ipc.of.electron.emit('GGFBLogin-Success', token);
                })
            })

            // đóng cửa sổ đăng nhập, reload lại trang web chính
            res.send(`
                <h2>Đã uỷ quyền thành công, hãy đóng trang này và quay lại ứng dụng của bạn</h2>
                <script>
                    window.opener.postMessage({ message: 'reload', token: '${token}' }, '${urlpage}');
                    window.close();
                </script>`);
        } catch (err) {
            logger.error(err);
        }
    },

    loginFacebook: async (req, res) => {
        const user = req.user;
        const facebookId = user.id;
        const displayName = user.displayName;
        const avatar = user.photos[0].value;
        var token;

        try {
            // Kiểm tra FacebookId
            var sql = 'select * from users where FacebookId = ?';
            const checkFacebookId = await query(sql, [facebookId]);

            if (checkFacebookId.length > 0) {
                // Nếu facebookId tồn tại, tiến hành đăng nhập
                const userId = checkFacebookId[0].id; // Lấy id người dùng

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
                    token = checkToken[0].token; // Gán token vào biến
                }
            } else {
                // nếu facebookId không tồn tại, tạo mới tài khoản và thêm vào database
                sql = 'INSERT INTO Users (FacebookId, Avatar, DisplayName) VALUES (?, ?, ?)';
                const insertUserResult = await query(sql, [facebookId, avatar, displayName]);

                // Lấy ra userId
                sql = 'select * from users where FacebookId = ?';
                const checkUsers = await query(sql, [facebookId]);
                const userId = checkUsers[0].id;

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
                    token = checkToken[0].token; // Gán token vào biến
                }
            }

            // Gửi thông điệp đến electron
            ipc.connectTo('electron', () => {
                ipc.of.electron.on('connect', () => {
                    // Gửi đến electron
                    ipc.of.electron.emit('GGFBLogin-Success', token);
                })
            })

            // đóng cửa sổ đăng nhập, reload lại trang web chính
            res.send(`
                <h2>Đã uỷ quyền thành công, hãy đóng trang này và quay lại ứng dụng của bạn</h2>
                <script>
                    window.opener.postMessage({ message: 'reload', token: '${token}' }, '${urlpage}');
                    window.close();
                </script>`);
        } catch (err) {
            logger.error(err);
        }
    },

    loginGGDrive: async (req, res) => {
        // Tạo url xác thực OAuth2
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.appdata', 'https://www.googleapis.com/auth/drive.file'],
        });
        res.redirect(authUrl);
    },

    loginGGDriveCallback: async (req, res) => {
        // Xử lý redirect URL callback
        const { code } = req.query;

        try {
            // Trao đổi mã truy cập để lấy Refresh Token
            const { tokens } = await oauth2Client.getToken(code);
            const refreshToken = tokens.refresh_token;

            // Sử dụng Refresh Token để lấy thông tin người dùng
            oauth2Client.setCredentials({ refresh_token: refreshToken });

            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            const userInfo = await drive.about.get({
                fields: 'user'
            });
            const userEmail = userInfo.data.user.emailAddress;

            // Thêm email vào tệp ini
            appIniConfigs.updateIniConfigs('Data', 'emailGGDrive', userEmail);
            appIniConfigs.updateIniConfigs('Data', 'syncDate', myUtils.formatDate(new Date()));

            // Mã hóa Refresh Token 
            const encryptedToken = myUtils.encryptRefreshToken(refreshToken);

            // Lưu Refresh Token vào tệp json
            const data = { encryptedToken };
            fs.writeFile(pathSettingFolder + 'data/Token.json', JSON.stringify(data), (err) => {
                if (err) { console.error(err) }
            });

            // Gửi thông điệp đến electron
            ipc.connectTo('electron', () => {
                ipc.of.electron.on('connect', () => {
                    // Gửi đến electron
                    ipc.of.electron.emit('GGDriveCallback')
                })
            })

            res.send(`
            <script>
                window.opener.postMessage({ message: 'syncData'}, '${urlpage}');
                window.close()
            </script>
            <h2>Đã uỷ quyền thành công, hãy đóng trang này và quay lại ứng dụng của bạn</h2>`);

        } catch (error) {
            logger.error(error, 'Lỗi xử lý callback');
            res.status(500).send('Đã xảy ra lỗi!');
        }
    },

    logoutGGDrive: async (req, res) => {
        // Kiểm tra tệp tin có tồn tại không trước khi xoá
        if (fs.existsSync(pathSettingFolder + 'data/Token.json')) {
            fs.unlinkSync(pathSettingFolder + 'data/Token.json');
            console.log('Tệp Token.json đã được xoá thành công.');

            // appIniConfigs.updateIniConfigs('Data', 'fileGGDriveId', '');
            appIniConfigs.updateIniConfigs('Data', 'emailGGDrive', '');
            appIniConfigs.updateIniConfigs('Data', 'syncDate', '');

            res.json({ success: true, message: "Đăng xuất khỏi GGDrive thành công" })
        } else {
            res.json({ success: false, message: "Đăng xuất khỏi GGDrive thất bại" })
            console.log('Tệp Token.json không tồn tại.');
        }
    },
}