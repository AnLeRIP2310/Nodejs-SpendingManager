const { app } = require('electron');
const expressApp = require('./expressApp');
const appIniConfigs = require('./configs/appIniConfigs');
const windowManager = require('./electron/windowManager');
const updateEvent = require('./electron/events/updateEvent');
const notifyEvent = require('./electron/events/notifyEvent');
require('./electron/events/appEvent');
require('./electron/events/authEvent');
require('./electron/events/dataEvent');
require('dotenv').config();



// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    global.wssStarted = true;
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Nếu người dùng cố gắn mở ứng dụng mới, hiển thị cửa sổ chính
        if (windowManager.getMainWindow()) {
            if (windowManager.getMainWindow().isMinimized()) windowManager.getMainWindow().restore();
            windowManager.getMainWindow().focus();
        }
    });

    global.wssStarted = false;

    // Chạy cửa sổ chính
    app.whenReady().then(() => {
        // Khởi chạy express server
        expressApp.startServer(() => {
            // Gán phiên bản ứng dụng vào tệp .ini
            const version = require('../package.json').version;
            appIniConfigs.updateIniConfigs('App', 'version', version);
            // Đặt cửa sổ khởi chạy chính
            windowManager.createMainWindow();
            // Kiểm tra phiên bản mới
            updateEvent.checkUpdateSettings();
            // Kiểm tra và gửi thông báo
            notifyEvent.scheduleRandomNotifications();
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (windowManager.mainWindow === null) {
            windowManager.createMainWindow();
        }
    });
}