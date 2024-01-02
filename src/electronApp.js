const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const expressApp = require('./expressApp');
const { closeDB, dbPath } = require('./configs/db');


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

                mainWindow.reload();
            }
        });
    }
})

// Bắt sự kiện đóng server và database
ipcMain.on('close-server', () => {
    expressApp.stopServer(() => {
        console.log('may chu ngung hoat dong, san sang xoa tep');
        closeDB(() => {
            const maxAttempts = 5; // Số lần tối đa thực hiện xoá
            let attempts = 0;

            const tryDelete = () => {
                if (fs.existsSync(dbPath)) {
                    try {
                        fs.unlinkSync(dbPath);
                        console.log('xoa tep database thanh cong!');
                    } catch (err) {
                        console.error('co loi khi xoa:', err);
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(tryDelete, 2000); // Thử xoá lại sau 5 giây
                        } else {
                            console.log(`Không thể xóa tệp database sau ${maxAttempts} lần thử.`);
                        }
                    }
                } else {
                    console.log('tep database khong ton tai.');
                }
            };

            tryDelete(); // Gọi hàm xoá lần đầu tiên
        });
    });
});

