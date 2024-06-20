const { shell, ipcMain } = require('electron');
const windowManager = require('../windowManager');
const ipc = require('node-ipc');



// Cấu hình IPC
ipc.config.id = 'electron';
ipc.config.retry = 1500;
ipc.config.silent = true;


// Bắt sự kiện của node-ipc
ipc.serve(() => {
    // Bắt sự kiện sau khi đăng nhập google drive
    ipc.server.on('GGDriveCallback', (data, socket) => {
        // Gửi về lại phía renderer
        const mainWindow = windowManager.getMainWindow();
        mainWindow.webContents.send('GGDriveCallback');
    })
});
ipc.server.start();

// Bắt sự kiện mở các liên kết url
ipcMain.on('openUrl', (event, url) => {
    shell.openExternal(url);
});