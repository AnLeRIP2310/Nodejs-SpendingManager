const { app, BrowserWindow, ipcMain, dialog, screen, Tray, Menu, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const expressApp = require('./expressApp');
const { dbPath, query } = require('./configs/db');
const appSettings = require('./configs/appSettings');
const notifier = require('node-notifier');
const schedule = require('node-schedule');
const axios = require('axios');
const { logError } = require('./configs/logError');


// try {
//     require('electron-reloader')(module, {
//         // ignored: "./data/SpendingDB.sqlite",
//     });
// } catch (_) { }


let loginWindow;
let mainWindow;
let tray;
var isQuitting = false;



// hàm lấy ra cấu hình trong cài đặt
const getCloseDefaultSetting = () => {
    // Đọc và chuyển đổi đổi tượng
    const iniObject = appSettings.parseIni(fs.readFileSync(appSettings.iniFilePath, 'utf8'));
    return iniObject.App.closeDefault; // Lấy ra biến trong cài đặt
}

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

    // Khi cửa sổ đóng, giải phóng bộ nhớ
    loginWindow.on('closed', () => {
        loginWindow = null;
    });
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
        nodeIntegration: true,
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

    tray = new Tray(path.join(__dirname, '../public/images/favicon.ico'));
    tray.setToolTip('Spending Manager');
    tray.on('double-click', () => { mainWindow.isVisible() || mainWindow.show(); });
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Mở', click: () => { mainWindow.show(); } },
        { label: 'Thoát', click: () => { isQuitting = true; app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);

    // Khi cửa sổ chính đóng, giải phóng bộ nhớ
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Bắt sự kiện close của mainWindow
    mainWindow.on('close', (event) => {
        var closeDefault = getCloseDefaultSetting();

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
}

// Hàm gửi thông báo
function sendNotification() {
    notifier.notify({
        title: 'Nhắc nhở chi tiêu',
        message: 'Hôm nay bạn có khoản chi nào không?, nếu có thì nhớ ghi vào nhé:D',
        icon: path.join(__dirname, '../public/images/favicon.ico'),
        wait: true,
    });
}

notifier.on('click', function (notifierObject, options, event) {
    mainWindow.isVisible() || mainWindow.show();
});

// Hàm kiểm tra dữ liệu trước khi thông báo
function checkForNewData() {
    setTimeout(() => {
        axios.get('http://localhost:3962/setting/checkLastEntry')
            .then(res => {
                // Không có dữ liệu mới, gửi thông báo
                if (res.data.result == 0) {
                    // Kiểm tra cài đặt xem có được gửi thông báo không
                    const notifySpend = appSettings.parseIni(fs.readFileSync(appSettings.iniFilePath, 'utf8')).App.notifySpend;
                    if (notifySpend == true || notifySpend == 'true') { sendNotification() }
                }
            })
            .catch(error => {
                console.error('Lỗi khi gửi yêu cầu:', error);
                logError(error);
            });
    }, 1000);
}

// Hàm lên lịch hẹn ngẫu nhiên một lần trong khoảng thời gian từ 8h sáng đến 8h tối
function scheduleRandomNotifications() {
    // Lịch hẹn thứ nhất
    const firstRandomHour = Math.floor(Math.random() * 13) + 8; // Ngẫu nhiên từ 8h đến 20h
    const firstRandomMinute = Math.floor(Math.random() * 60); // Ngẫu nhiên từ 0 đến 59

    const firstScheduleRule = new schedule.RecurrenceRule();
    firstScheduleRule.hour = firstRandomHour;
    firstScheduleRule.minute = firstRandomMinute;

    schedule.scheduleJob(firstScheduleRule, () => {
        // Kiểm tra xem có dữ liệu mới trong ngày không
        checkForNewData();
    });

    // Lịch hẹn thứ hai
    const secondRandomHour = Math.floor(Math.random() * 13) + 8; // Ngẫu nhiên từ 8h đến 20h
    const secondRandomMinute = Math.floor(Math.random() * 60); // Ngẫu nhiên từ 0 đến 59

    const secondScheduleRule = new schedule.RecurrenceRule();
    secondScheduleRule.hour = secondRandomHour;
    secondScheduleRule.minute = secondRandomMinute;

    schedule.scheduleJob(secondScheduleRule, () => {
        // Kiểm tra xem có dữ liệu mới trong ngày không
        checkForNewData();
    });
} scheduleRandomNotifications();

// Bắt sự kiện thoát ứng dụng
ipcMain.on('quit-app', (event, data) => {
    if (data == true) {
        appSettings.updateSetting('closeDefault', 'quit', 'App');
    }
    isQuitting = true;
    app.quit();
})

// Bắt sự kiện thu xuống khay hệ thống
ipcMain.on('collapse-tray', (event, data) => {
    if (data == true) {
        appSettings.updateSetting('closeDefault', 'tray', 'App');
    }
    closeDefault = getCloseDefaultSetting();
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
});

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
    isQuitting = true;
    mainWindow.close();
    // Mở cửa sổ đăng nhập
    createAuthWindow();
})

// Bắt sự kiện xuất file database
ipcMain.on('export-db', () => {
    try {
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
    } catch (e) {
        console.log(e)
        logError(e)
    }
});

// Bắt sự kiện nhập file database
ipcMain.on('import-db', async () => {
    try {
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
    } catch (e) {
        console.log(e)
        logError(e)
    }
})

// Bắt sự kiện thay đổi đường dẫn lưu database
ipcMain.on('change-dbPath', () => {
    try {
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
    } catch (e) {
        console.log(e)
        logError(e)
    }
});

// Bắt sự kiện kiểm tra theme trên hệ thống
ipcMain.on('get-system-theme', (event) => {
    // Gửi phản hồi về quá trình render
    event.reply('reply-system-theme', nativeTheme.shouldUseDarkColors);
});

// Bắt sự kiện thêm ứng dụng vào khởi động cùng window
ipcMain.on('startWithWindow', () => {
    const iniObject = appSettings.parseIni(fs.readFileSync(appSettings.iniFilePath, 'utf8'));
    const startWithWindow = iniObject.App.startWithWindow

    if (startWithWindow == true || startWithWindow == 'true') {
        app.setLoginItemSettings({ openAtLogin: true });
    } else {
        app.setLoginItemSettings({ openAtLogin: false });
    }
})