const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const expressApp = require('./expressApp');

try {
    require('electron-reloader')(module);
} catch (_) { }

let mainWindow;

app.whenReady().then(() => {
    expressApp.startServer(() => {
        createWindow();
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 964,
        height: 564,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '/views/index.html'));
}