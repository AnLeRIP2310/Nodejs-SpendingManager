const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const expressApp = require('./expressApp');
const { closeDB, dbPath } = require('./configs/db');
const appSettings = require('./configs/appSettings');


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
        // Đặt cửa sổ khởi chạy chính
        createMainWindow();
    });
});


function createAuthWindow() {
    const mainScreen = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 800, windowHeight = 500;
    const screenWidth = mainScreen.width;
    const screenHeight = mainScreen.height;

    loginWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            devTools: true,
            preload: path.join(__dirname, '/configs/preload.js')
        },
        x: Math.floor(screenWidth * 0.65 - windowWidth / 2),
        y: Math.floor((screenHeight - windowHeight) / 2),
    });

    loginWindow.loadFile(path.join(__dirname, '/views/login.html'));
}

function createMainWindow() {
    const mainScreen = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 930, windowHeight = 565;
    const screenWidth = mainScreen.width;
    const screenHeight = mainScreen.height;

    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            devTools: true,
            preload: path.join(__dirname, '/configs/preload.js')
        },
        x: Math.floor(screenWidth * 0.65 - windowWidth / 2),
        y: Math.floor((screenHeight - windowHeight) / 2),
    });

    mainWindow.loadFile(path.join(__dirname, '/views/index.html'));

    // Khi cửa sổ chính đóng, giải phóng bộ nhớ
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Bắt sự kiện khởi động lại ứng dụng
ipcMain.on('reload-app', () => {
    app.relaunch();
    app.exit();
})

// Bắt sự kiện đăng nhập thành công
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

// Bắt sự kiện xuất file database
ipcMain.on('export-db', () => {
    // Kiểm tra sự tồn tại của database
    if (fs.existsSync(dbPath)) {
        // Thực hiện lựa chọn vị trí lưu tệp
        dialog.showSaveDialog({
            title: 'Xuất tệp database',
            defaultPath: 'SpendingDB.db', // Tên mặc định của tệp xuất
            buttonLabel: 'Export',
            filters: [{ name: 'SQLite database', extensions: ['db'] }]
        }).then((result) => {
            if (!result.canceled && result.filePath) {
                const destinationPath = result.filePath;
                // Sao chép tệp database vào địa chỉ mới
                fs.copyFile(dbPath, destinationPath, (err) => {
                    if (err) {
                        console.error('Lỗi khi sao chép:', err);
                    } else {
                        console.log('Đã xuất tệp database thành công!');
                    }
                });
            }
        }).catch((err) => {
            console.error('Lỗi khi mở cửa sổ lưu tệp:', err);
        });
    } else {
        console.log('Database không tồn tại.');
    }
});

// Bắt sự kiện nhập file database
ipcMain.on('import-db', async () => {
    // Hiển thị hộp thoại mở tệp
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'SQLite database', extensions: ['db'] }]
    });

    // Kiểm tra xem người dùng đã chọn tệp hay chưa
    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]; // Đường dẫn đến tệp người dùng đã chọn

        // Thực hiện sao chép tệp đã chọn vào dbPath
        fs.copyFile(filePath, dbPath, (err) => {
            if (err) {
                console.error('Lỗi khi sao chép:', err);
                // Xử lý lỗi nếu có
            } else {
                console.log('Sao chép tệp thành công!');
                // Xử lý khi sao chép thành công

                app.relaunch();
                app.exit();
            }
        });
    }
})

// Bắt sự kiện thay đổi đường dẫn lưu database
ipcMain.on('change-dbPath', () => {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    }).then(result => {
        if (!result.canceled) {
            const selectedDirectory = result.filePaths[0];
            const newdbPath = path.join(selectedDirectory, 'SpendingDB.db');

            // Sao chép tệp db đến vị trí mới
            fs.copyFileSync(dbPath, newdbPath);

            const resultPath = appSettings.updateSetting('dbPath', newdbPath, 'Data');

            if (resultPath) {
                app.relaunch();
                app.exit();
            } else {
                console.error('Lỗi khi thay đổi thư mục:');
            }
        }
    }).catch(err => {
        console.error(err);
    });
});

