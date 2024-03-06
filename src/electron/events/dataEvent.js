const { ipcMain, dialog, app } = require('electron');
const { dbPath } = require('../../configs/db');
const fs = require('fs');
const logger = require('../../configs/logger');
const path = require('path');
const appIniConfigs = require('../../configs/appIniConfigs');



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
        dialog.showOpenDialog({
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