const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const expressApp = require('./expressApp');

try {
    require('electron-reloader')(module, {
        // ignored: "./data/SpendingDB.sqlite",
    });
} catch (_) { }


let loginWindow;
let mainWindow;

// Chạy cửa sổ chính
app.whenReady().then(() => {
    expressApp.startServer(() => {
        createMainWindow();
    });
});


function createAuthWindow() {
    loginWindow = new BrowserWindow({
        width: 800,
        height: 500,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            devTools: true,
            preload: path.join(__dirname, '/configs/preload.js')
        },
    });
    loginWindow.loadFile(path.join(__dirname, '/views/login.html'));
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 931,
        height: 565,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            devTools: true,
            preload: path.join(__dirname, '/configs/preload.js')
        },
    });
    mainWindow.loadFile(path.join(__dirname, '/views/index.html'));

    // Khi cửa sổ chính đóng, giải phóng bộ nhớ
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

ipcMain.on('login-success', () => {
    // Đóng cửa sổ login.html
    loginWindow.close();

    // Mở cửa sổ index.html
    createMainWindow();
});

// Bắt sự kiện đăng nhập hết hạn
ipcMain.on('login-expired', () => {
    // Đóng cửa sổ main
    mainWindow.close();

    // Mở cửa sổ đăng nhập
    createAuthWindow();
})