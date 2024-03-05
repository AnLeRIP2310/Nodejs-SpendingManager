const { app, BrowserWindow, ipcMain, dialog, screen, Tray, Menu, nativeTheme, shell } = require('electron');
const { autoUpdater } = require('electron-updater')
const path = require('path');
const fs = require('fs');
const expressApp = require('./expressApp');
const { dbPath } = require('./configs/db');
const appIniConfigs = require('./configs/appIniConfigs');
const notifier = require('node-notifier');
const schedule = require('node-schedule');
const axios = require('axios');
const prettyBytes = require('pretty-bytes');
const logger = require('./configs/logger');
const ipc = require('node-ipc');
const packageObj = require('../package.json');



// Object.defineProperty(app, 'isPackaged', {
//     get() {
//         return true;
//     }
// });


// Cấu hình IPC
ipc.config.id = 'electron';
ipc.config.retry = 1500;
ipc.config.silent = true;


let loginWindow;
let mainWindow;
let tray;
var isQuitting = false;



// Chạy cửa sổ chính
app.whenReady().then(() => {
    // Gán phiên bản vào tệp .ini
    appIniConfigs.updateIniConfigs('App', 'version', packageObj.version);

    // Khởi chạy express server
    expressApp.startServer(() => {
        // Đặt cửa sổ khởi chạy chính
        createMainWindow();

        // Kiểm tra phiên bản mới
        autoUpdateSettings();
    });
});


// Hàm tạo cửa sổ đăng nhập
function createAuthWindow() {
    const mainScreen = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 800;
    const windowHeight = 500;
    const screenWidth = mainScreen.width;
    const screenHeight = mainScreen.height;

    loginWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            devTools: false,
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

// Hàm tạo cửa sổ chính
function createMainWindow() {
    const mainScreen = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 930;
    const windowHeight = 565;
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
        var closeDefault = appIniConfigs.getIniConfigs('closeDefault');

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
                    const notifySpend = appIniConfigs.getIniConfigs('notifySpend');
                    if (notifySpend == true || notifySpend == 'true') { sendNotification() }
                }
            })
            .catch(error => {
                logger.error(error, 'Lỗi khi gửi yêu cầu');
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



// Bắt sự kiện của node-ipc
ipc.serve(() => {
    // Bắt sự kiện sau khi đăng nhập google drive
    ipc.server.on('GGDriveCallback', (data, socket) => {
        // Gửi về lại phía renderer
        mainWindow.webContents.send('GGDriveCallback');
    })

    // Bắt sự kiện sau khi đăng nhập google
    ipc.server.on('GGFBLogin-Success', (data, socket) => {
        // Gửi về lại phía renderer
        loginWindow.webContents.send('GGFBLogin-Success', data);
    })
}); ipc.server.start();

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

// Bắt sự kiện thoát ứng dụng
ipcMain.on('quit-app', (event, data) => {
    if (data == true) {
        appIniConfigs.updateIniConfigs('App', 'closeDefault', 'quit');
    }
    isQuitting = true;
    app.quit();
})

// Bắt sự kiện thu xuống khay hệ thống
ipcMain.on('collapse-tray', (event, data) => {
    if (data == true) {
        appIniConfigs.updateIniConfigs('App', 'closeDefault', 'tray');
    }
    closeDefault = getCloseDefaultSetting();
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
});

// Bắt sự kiện khởi động lại ứng dụng
ipcMain.on('reload-app', () => {
    app.relaunch();
    app.exit();
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
                            logger.error(err, 'Lỗi khi sao chép database');
                        } else {
                            console.log('Đã xuất tệp database thành công!');
                        }
                    });
                }
            }).catch((err) => {
                logger.error(err, 'Lỗi khi mở cửa sổ lưu tệp');
            });
        } else {
            logger.error('Không tìm thấy database');
        }
    } catch (e) {
        logger.error(e)
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
                    logger.error('Lỗi khi sao chép:', err);
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
        logger.error(e)
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

                const resultPath = appIniConfigs.updateIniConfigs('Data', 'dbPath', newdbPath);

                if (resultPath) {
                    app.relaunch();
                    app.exit();
                } else {
                    logger.error('Lỗi khi thay đổi thư mục:');
                }
            }
        }).catch(err => {
            logger.error(err);
        });
    } catch (e) {
        logger.error(e)
    }
});

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


// Cấu hình autoUpdater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;


// Hàm tự động cập nhật
function autoUpdateSettings() {
    let autoUpdate = appIniConfigs.getIniConfigs('autoUpdate');

    if (autoUpdate) {
        setTimeout(() => {
            autoUpdater.checkForUpdates();
        }, 5000);
    }
}

// Hàm để lấy thông tin release từ GitHub
async function getGitHubReleaseInfo(owner, repo) {
    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
        return response.data;
    } catch (error) {
        logger.error(error.message, 'Lỗi khi lấy thông tin ghi chú phát hành của github')
        return null;
    }
}


// Bắt sự kiện autoUpdater từ client
ipcMain.on('check-for-update', () => {
    autoUpdater.checkForUpdates();
})

// Bắt sự kiện có bản cập nhật
autoUpdater.on('update-available', async () => {
    try {
        const gitUrl = packageObj.repository.url
        var releaseNote, owner, repo;

        // Sử dụng biểu thức chính quy để tìm owner và repo
        const match = gitUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\.git/i);

        if (match) {
            owner = match[1]; repo = match[2];

            // Lấy thông tin về bản cập nhật
            const githubReleaseInfo = await getGitHubReleaseInfo(owner, repo);
            if (githubReleaseInfo) {
                releaseNote = githubReleaseInfo.body || 'Không có ghi chú phát hành về bản cập nhật';
            }
        }

        // Lấy ra cấu hình về việc có được hiển thị thông báo không
        const downloadPrompt = appIniConfigs.getIniConfigs('downloadPrompt')

        // Gửi về client renderer
        mainWindow.webContents.send('update-available', { downloadPrompt, releaseNote });
    } catch (e) {
        logger.error(e)
    }
});

// Bắt sự kiện cho phép tải về bản cập nhật
ipcMain.on('allow-download-update', () => {
    autoUpdater.downloadUpdate();
})

// Bắt sự kiện không có bản cập nhật
autoUpdater.on('update-not-available', () => {
    // Gửi về client renderer
    mainWindow.webContents.send('update-not-available');
});

// Bắt sự kiện có lỗi khi cập nhật
autoUpdater.on('error', (err) => {
    // Gửi về client renderer
    mainWindow.webContents.send('update-error', err);
    logger.error('Có lỗi khi câp nhật:', err);
});

// Bắt sự kiện tiến trình tải về
autoUpdater.on('download-progress', (progressObj) => {
    progressObj.bytesPerSecond = prettyBytes(progressObj.bytesPerSecond);
    progressObj.total = prettyBytes(progressObj.total);
    progressObj.transferred = prettyBytes(progressObj.transferred);
    progressObj.percent = Math.floor(progressObj.percent);

    // Gửi về client renderer
    mainWindow.webContents.send('download-progress', progressObj);
});

// Bắt sự kiện sau khi tải hoàn tất
autoUpdater.on('update-downloaded', () => {
    // Gửi về client renderer
    mainWindow.webContents.send('update-downloaded');

    // Hiển thị thông báo khi bản cập nhật đã được tải về
    dialog.showMessageBox({
        type: 'info',
        message: 'Bản cập nhật đã được tải về. Ứng dụng sẽ khởi động lại để cài đặt cập nhật.',
        buttons: ['OK'],
    }).then((response) => {
        if (response.response === 0) {
            isQuitting = true;
            autoUpdater.quitAndInstall();
        }
    });
});