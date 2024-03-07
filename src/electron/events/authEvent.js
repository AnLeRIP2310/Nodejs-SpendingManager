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

    // Bắt sự kiện sau khi đăng nhập google
    ipc.server.on('GGFBLogin-Success', (data, socket) => {
        // Gửi về lại phía renderer
        const loginWindow = windowManager.getLoginWindow();
        loginWindow.webContents.send('GGFBLogin-Success', data);
    })
});
ipc.server.start();

// Bắt sự kiện đăng nhập google drive
ipcMain.on('loginGGDrive', (event, url) => {
    shell.openExternal(url); // Mở cửa sổ đăng nhập trên trình duyệt
})

// Bắt sự kiện đăng nhập google
ipcMain.on('loginGoogle', (event, url) => {
    shell.openExternal(url); // Mở cửa sổ đăng nhập trên trình duyệt
})

// Bắt sự kiện đăng nhập facebook
ipcMain.on('loginFacebook', (event, url) => {
    shell.openExternal(url); // Mở cửa sổ đăng nhập trên trình duyệt
})

// Bắt sự kiện đăng nhập thành công
ipcMain.on('login-success', () => {
    const loginWindow = windowManager.getLoginWindow();

    // Đóng cửa sổ đăng nhập
    loginWindow.close();

    // Mở cửa sổ chính
    windowManager.createMainWindow();
});

// Bắt sự kiện đăng nhập hết hạn
ipcMain.on('login-expired', () => {
    const mainWindow = windowManager.getMainWindow();
    const isQuitting = windowManager.getIsQuitting();

    if (!isQuitting) {
        windowManager.setIsQuitting(true);
        mainWindow.close();

        // Mở cửa sổ đăng nhập
        const loginWindow = windowManager.getLoginWindow();
        loginWindow && windowManager.createLoginWindow();
    }
})