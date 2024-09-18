const { ipcMain, app, nativeTheme } = require('electron');
const windowManager = require('../windowManager');
const appIniConfigs = require('../../configs/appIniConfigs');
const logger = require('../../configs/logger');
const axios = require('axios');
const fs = require("fs");
const path = require("path");



// Kiểm tra đăng nhập vào drive
function checkDriveLogin() {
    return fs.existsSync(path.join(appIniConfigs.getfolderAppConfigs(), 'data', 'Token.json'));
}

// Sao lưu trước khi thoát
let appQuit = false;
app.on('before-quit', async (event) => {
    try {
        if (!appQuit && app.isPackaged && checkDriveLogin()) {
            event.preventDefault();

            const mainWindow = windowManager.getMainWindow();
            mainWindow?.isVisible() && mainWindow?.hide();

            await axios.get(`http://${process.env.HOST}:${process.env.PORT}/setting/backupData`, { timeout: 5000 });
            appQuit = true; windowManager.setIsQuitting(true); app.exit();
        }
    } catch (e) {
        logger.error(e); app.exit();
    }
});

// Bắt sự kiện thoát ngay lập tức
ipcMain.on("logout", async () => {
    app.exit();
});

// Bắt sự kiện thoát ứng dụng
ipcMain.on('quit-app', (event, data) => {
    if (data) {
        appIniConfigs.updateIniConfigs('App', 'closeDefault', 'quit');
    }
    windowManager.setIsQuitting(true);
    app.quit();
});

// Bắt sự kiện thu xuống khay hệ thống
ipcMain.on('collapse-tray', (event, data) => {
    if (data) {
        appIniConfigs.updateIniConfigs('App', 'closeDefault', 'tray');
    }
    const mainWindow = windowManager.getMainWindow();
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
});

// Bắt sự kiện kiểm tra theme trên hệ thống
ipcMain.on('get-system-theme', (event) => {
    // Gửi phản hồi về quá trình render
    event.reply('reply-system-theme', nativeTheme.shouldUseDarkColors);
});

// Bắt sự kiện thêm ứng dụng vào khởi động cùng window
ipcMain.on('startWithWindow', () => {
    const startWithWindow = appIniConfigs.getIniConfigs('startWithWindow');

    if (startWithWindow || startWithWindow == 'true') {
        app.setLoginItemSettings({ openAtLogin: true });
    } else {
        app.setLoginItemSettings({ openAtLogin: false });
    }
});