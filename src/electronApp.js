const { app } = require('electron');
const expressApp = require('./expressApp');
const appIniConfigs = require('./configs/appIniConfigs');
const windowManager = require('./electron/windowManager');
const updateEvent = require('./electron/events/updateEvent');
const notifyEvent = require('./electron/events/notifyEvent');
require('./electron/events/appEvent');
require('./electron/events/authEvent');
require('./electron/events/dataEvent');



// Chạy cửa sổ chính
app.whenReady().then(() => {
    // Gán phiên bản ứng dụng vào tệp .ini
    const version = require('../package.json').version;
    appIniConfigs.updateIniConfigs('App', 'version', version);

    // Khởi chạy express server
    expressApp.startServer(() => {
        // Đặt cửa sổ khởi chạy chính
        windowManager.createMainWindow();

        // Kiểm tra phiên bản mới
        updateEvent.checkUpdateSettings();

        // Tạo thông báo
        notifyEvent.scheduleRandomNotifications();
    });
});