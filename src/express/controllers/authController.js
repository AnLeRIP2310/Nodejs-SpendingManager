const ipc = require('node-ipc');
const fs = require('fs');
const { google } = require('googleapis');
const logger = require('../../configs/logger');
const appIniConfigs = require('../../configs/appIniConfigs');
const myUtils = require('../../configs/myUtils');
const path = require("path");



// Cấu hình IPC
ipc.config.id = 'express';
ipc.config.retry = 1500;
ipc.config.silent = true;

let urlpage = ''; // Biến global để lưu trữ urlpage
var pathSettingFolder = appIniConfigs.getfolderAppConfigs();

// Khởi tạo OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    process.env.GG_DRIVE_CLIENT_ID,
    process.env.GG_DRIVE_CLIENT_SECRET,
    process.env.GG_DRIVE_REDIRECT_URI
);


module.exports = {
    urlPage: (req, res) => {
        const { urlpage: newUrlpage } = req.query;
        urlpage = newUrlpage; // Cập nhật giá trị của biến global
    },

    loginGGDrive: async (req, res) => {
        // Tạo url xác thực OAuth2
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.appdata'],
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
            appIniConfigs.updateIniConfigs('Data', 'driveEmail', userEmail);
            appIniConfigs.updateIniConfigs('Data', 'backupDate', myUtils.formatDate(new Date()));

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
            <h2>Đã đăng nhập thành công, hãy đóng trang này và quay lại ứng dụng của bạn</h2>`);

        } catch (error) {
            logger.error(error, 'Đã xảy ra lỗi khi đăng nhập');
            res.status(500).send('Đã xảy ra lỗi!');
        }
    },

    logoutGGDrive: async (req, res) => {
        // Kiểm tra tệp tin có tồn tại không trước khi xoá
        if (fs.existsSync(path.join(pathSettingFolder, 'data', 'Token.json'))) {
            fs.unlinkSync(path.join(pathSettingFolder, 'data', 'Token.json'));
            console.log('Tệp Token.json đã được xoá thành công.');

            // appIniConfigs.updateIniConfigs('Data', 'driveFileId', '');
            appIniConfigs.updateIniConfigs('Data', 'driveEmail', '');
            appIniConfigs.updateIniConfigs('Data', 'backupDate', '');

            res.json({ success: true, message: "Đăng xuất khỏi GGDrive thành công" })
        } else {
            res.json({ success: false, message: "Đăng xuất khỏi GGDrive thất bại" })
            console.log('Tệp Token.json không tồn tại.');
        }
    },
}