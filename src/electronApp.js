const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const expressApp = require('./expressApp');

try {
    require('electron-reloader')(module, {
        ignored: "./data/SpendingDB.sqlite",
    });
} catch (_) { }

let mainWindow;

app.whenReady().then(() => {
    expressApp.startServer(() => {
        createWindow();
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 950,
        height: 558,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '/views/index.html'));
}