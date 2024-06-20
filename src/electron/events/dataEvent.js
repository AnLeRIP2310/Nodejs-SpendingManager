const { ipcMain, dialog, app } = require('electron');
const db = require('../../configs/db');
const fs = require('fs');
const logger = require('../../configs/logger');
const zlib = require("zlib");
const path = require('path');
const windowManager = require('../windowManager');



// Bắt sự kiện xuất file database
ipcMain.on('export-data', async () => {
    try {
        const folderExport = (await dialog.showOpenDialog({ properties: ['openDirectory'] })).filePaths[0];
        if (!folderExport) return;

        // Thực hiện truy vấn lấy dữ liệu cần xuất
        const queries = [
            db.query('SELECT * FROM spendinglist'),
            db.query('SELECT * FROM spendingitem'),
            db.query('SELECT * FROM noted'),
            db.query('SELECT * FROM income')
        ];
        const [spendList, spendItem, noted, income] = await Promise.all(queries);

        const dataObj = {};
        if (spendList.length > 0) dataObj.spendingList = spendList;
        if (spendItem.length > 0) dataObj.spendingItem = spendItem;
        if (noted.length > 0) dataObj.noted = noted;
        if (income.length > 0) dataObj.income = income;

        // Lưu tệp vào đường dẫn đã chọn
        fs.writeFileSync(path.join(folderExport, 'spendingData.json'), JSON.stringify(dataObj, null, 2));

        const mainWindow = windowManager.getMainWindow();
        mainWindow.webContents.send('export-data-success');
    } catch (e) {
        logger.error(e);
    }
});

// Bắt sự kiện nhập file database
ipcMain.on('import-data', async () => {
    const filePath = (await dialog.showOpenDialog({ properties: ['openFile'] })).filePaths[0];
    if (!filePath) return;

    // Đọc tệp từ đường dẫn đã chọn
    const content = fs.readFileSync(filePath);

    // Trả dữ liệu về renderer
    const mainWindow = windowManager.getMainWindow();
    mainWindow.webContents.send('import-data-success', content);
})