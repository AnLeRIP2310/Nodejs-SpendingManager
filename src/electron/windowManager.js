const { app, BrowserWindow, screen, Tray, Menu } = require('electron');
const appIniConfigs = require('../configs/appIniConfigs');
const path = require('path');



let mainWindow;
let loginWindow;
let tray;
let isQuitting = false;


// Hàm tạo cửa sổ đăng nhập
function createLoginWindow() {
    const mainScreen = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 800;
    const windowHeight = 500;
    const screenWidth = mainScreen.width;
    const screenHeight = mainScreen.height;
    const windowPositionX = parseFloat(appIniConfigs.getIniConfigs('windowPositionX'))
    const windowPositionY = parseFloat(appIniConfigs.getIniConfigs('windowPositionY'));

    loginWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            devTools: false,
            preload: path.join(__dirname, '..', 'configs', 'preload.js')
        },
        x: Math.floor(screenWidth * windowPositionX - windowWidth / 2),
        y: Math.floor((screenHeight * windowPositionY - windowHeight) / 2),
    });

    loginWindow.loadFile(path.join(__dirname, '..', 'views', 'login.html'));

    // Khi cửa sổ đóng, giải phóng bộ nhớ
    loginWindow.on('closed', () => {
        loginWindow = null;
    });

    return loginWindow
}

// Hàm tạo cửa sổ chính
function createMainWindow() {
    const mainScreen = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 930;
    const windowHeight = 565;
    const screenWidth = mainScreen.width;
    const screenHeight = mainScreen.height;
    const windowPositionX = parseFloat(appIniConfigs.getIniConfigs('windowPositionX'))
    const windowPositionY = parseFloat(appIniConfigs.getIniConfigs('windowPositionY'));

    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        resizable: true,
        autoHideMenuBar: true,
        nodeIntegration: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            devTools: false,
            preload: path.join(__dirname, '..', 'configs', 'preload.js')

        },
        x: Math.floor(screenWidth * windowPositionX - windowWidth / 2),
        y: Math.floor((screenHeight * windowPositionY - windowHeight) / 2),
    });

    mainWindow.loadFile(path.join(__dirname, '..', 'views', 'index.html'));

    tray = new Tray(path.join(__dirname, '..', '..', 'public', 'images', 'favicon.ico'));
    tray.setToolTip('Spending Manager');
    tray.on('double-click', () => { mainWindow.isVisible() || mainWindow.show(); });
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Mở', click: () => { mainWindow.show(); } },
        { label: 'Thoát', click: () => { isQuitting = true; app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);

    // Bắt sự kiện close của mainWindow
    mainWindow.on('close', (event) => {
        let closeDefault = appIniConfigs.getIniConfigs('closeDefault');

        if (isQuitting == false) {
            event.preventDefault();
            if (closeDefault == 'ask') {
                mainWindow.webContents.send('before-closeApp');
            } else if (closeDefault == 'quit') {
                isQuitting = true;
                app.quit();
            } else if (closeDefault == 'tray') {
                mainWindow.hide();
            }
        } else {
            app.quit();
        }
    });

    // Khi cửa sổ chính đóng, giải phóng bộ nhớ
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    return mainWindow;
}


const windowManager = {
    createLoginWindow,
    createMainWindow,
    getMainWindow: () => mainWindow,
    getLoginWindow: () => loginWindow,
    getIsQuitting: () => isQuitting,
    setIsQuitting: (value) => isQuitting = value
}

module.exports = windowManager;