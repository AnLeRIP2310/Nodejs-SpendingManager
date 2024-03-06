const { ipcMain, app, nativeTheme } = require('electron')
const windowManager = require('../windowManager');
const appIniConfigs = require('../../configs/appIniConfigs');


// Bắt sự kiện thoát ứng dụng
ipcMain.on('quit-app', (event, data) => {
    if (data == true) {
        appIniConfigs.updateIniConfigs('App', 'closeDefault', 'quit');
    }
    windowManager.setIsQuitting(true);
    app.quit();
})

// Bắt sự kiện thu xuống khay hệ thống
ipcMain.on('collapse-tray', (event, data) => {
    if (data == true) {
        appIniConfigs.updateIniConfigs('App', 'closeDefault', 'tray');
    }
    const mainWindow = windowManager.getMainWindow();
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
});

// Bắt sự kiện khởi động lại ứng dụng
ipcMain.on('reload-app', () => {
    app.relaunch();
    app.exit();
})

// Bắt sự kiện kiểm tra theme trên hệ thống
ipcMain.on('get-system-theme', (event) => {
    // Gửi phản hồi về quá trình render
    event.reply('reply-system-theme', nativeTheme.shouldUseDarkColors);
});

// Bắt sự kiện thêm ứng dụng vào khởi động cùng window
ipcMain.on('startWithWindow', () => {
    const startWithWindow = appIniConfigs.getIniConfigs('startWithWindow')

    if (startWithWindow == true || startWithWindow == 'true') {
        app.setLoginItemSettings({ openAtLogin: true });
    } else {
        app.setLoginItemSettings({ openAtLogin: false });
    }
})