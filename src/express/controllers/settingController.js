const appIniConfigs = require('../../configs/appIniConfigs');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const db = require('../../configs/db');
const logger = require('../../configs/logger');
const ggDrive = require('../../configs/ggDrive');
const myUtils = require('../../configs/myUtils');
const _ = require('lodash');
ggDrive.setAuthen();



// Lấy ra đường dẫn đến thư mục cấu hình của ứng dụng
var folderAppConfigs = appIniConfigs.getfolderAppConfigs();


module.exports = {
    getData: (req, res) => {
        try {
            // Lấy ra các cài đặt trong tệp ini
            const iniConfigs = appIniConfigs.getIniConfigs();

            res.json({
                dbPath: db.dbPath.get(),
                iniObject: iniConfigs,
            });
        } catch (e) {
            logger.error(e)
        }
    },

    editData: (req, res) => {
        const { name, value, group } = req.body;

        try {
            appIniConfigs.updateIniConfigs(group, name, value);
            res.json({ success: true });
        } catch (e) {
            logger.error(e)
        }
    },

    resetData: (req, res) => {
        let dbPath = db.dbPath.get();
        let defaultDbPath = db.dbPath.getDefault();

        if (appIniConfigs.getIniConfigs('dbPath') != 'default') {
            // Sao chép database về vị trí mặt định
            fs.copyFileSync(dbPath, defaultDbPath);

            // Tạo lại tệp cấu hình .ini để reset tất cả cài đặt
            appIniConfigs.createIniConfigs();
            res.json({ success: true, action: 'reload' });
        } else {
            // Tạo lại tệp cấu hình .ini để reset tất cả cài đặt
            appIniConfigs.createIniConfigs();
            res.json({ success: true });
        }
    },

    checkLastEntry: async (req, res) => {
        try {
            // Lấy ngày hiện tại (yyyy-mm-dd)
            const today = new Date().toISOString().split('T')[0];

            var sql = 'SELECT COUNT(*) as count FROM spendinglist WHERE lastentry >= ?'
            const result = await db.query(sql, [today])

            res.json({ success: true, result: result[0].count });
        } catch (e) {
            logger.error(e)
        }
    },

    checkSyncStatus: async (req, res) => {
        // Kiểm tra xem tệp refresh_token có tồn tại không
        if (fs.existsSync(path.join(folderAppConfigs, 'data', 'Token.json'))) {
            const emailGGDrive = appIniConfigs.getIniConfigs('emailGGDrive');
            const syncDate = appIniConfigs.getIniConfigs('syncDate');

            if (emailGGDrive != '', syncDate != '') {
                res.json({ status: true, message: 'Đã đăng nhập GGDrive', email: emailGGDrive, syncDate: syncDate })
            } else {
                res.json({ status: false, message: 'Chưa đăng nhập GGDrive' })
            }
        } else {
            res.json({ status: false, message: 'Chưa đăng nhập GGDrive' })
        }
    },

    backupData: async (req, res) => {
        const { token } = req.query;

        try {
            // Kiểm tra xem fileId có tồn tại trong tệp cấu hình không
            var fileId = appIniConfigs.getIniConfigs('fileGGDriveId');

            // Nếu fileId tồn tại trong tệp ini thì tiến hành lấy ra id đó để xoá tệp trên ggdrive
            if (fileId != '') { await ggDrive.deleteFile(fileId); }

            // Lấy ra id người dùng
            const userId = await db.table.users.getId(token);

            // Lấy danh sách chi tiêu
            var sql = 'select * from spendinglist where usersid = ?';
            const spendList = await db.query(sql, [userId]);

            // Lấy ra các mục của danh sách chi tiêu
            sql = 'select * from spendingitem';
            const spendItem = await db.query(sql);

            // Tạo biến obj chứa dữ liệu
            const dataObj = {
                spendingList: spendList,
                spendingItem: spendItem
            };

            // Chuyển obj thành chuỗi JSON với định dạng đẹp
            const jsonData = JSON.stringify(dataObj, null, 2);

            // Tải lên dữ liệu với ggdrive
            const resultUpload = await ggDrive.uploadFile('spendingData.json', jsonData, 'application/json');

            // Lưu id tệp vô settings ini
            if (resultUpload) {
                appIniConfigs.updateIniConfigs('Data', 'fileGGDriveId', resultUpload.data.id);
            }

            // Lưu ngày sao lưu vào settings ini
            appIniConfigs.updateIniConfigs('Data', 'syncDate', myUtils.formatDateTime(new Date()));

            res.json({ success: true });
        } catch (e) {
            logger.error(e); res.json({ success: false });
        }
    },

    syncData: async (req, res) => {
        ggDrive.setAuthen();

        try {
            // Lấy ra fileId trong cài dặt
            var fileId = appIniConfigs.getIniConfigs('fileGGDriveId');

            // Nếu fileId không tồn tại thì lấy ra fileId từ ggDrive
            if (fileId == '' || fileId == null || fileId == undefined) {
                const getFileId = await ggDrive.getListFile()

                // Kiểm tra xem có tệp tin nào không
                if (getFileId.files && getFileId.files.length > 0) {
                    // Lấy ra giá trị cuối cùng của mảng
                    const lastFileId = getFileId.files.length - 1
                    fileId = getFileId.files[lastFileId].id

                    // Lưu fileId vào setting ini để sử dụng sau này
                    appIniConfigs.updateIniConfigs('Data', 'fileGGDriveId', fileId);
                    appIniConfigs.updateIniConfigs('Data', 'syncDate', myUtils.formatDateTime(new Date()));
                } else {
                    // Trường hợp chưa có bất kì file nào thì trả về kết quả
                    res.json({ success: false, status: 404, message: 'Không tìm thấy tệp sao lưu' })
                    return;
                }
            }

            // Sau khi đã có fileId, tiến hành tải về máy
            const downloadResult = await ggDrive.downloadFile(fileId, path.join(folderAppConfigs, 'data', 'SpendingData.json'));

            // Sau khi đã tải về, đọc nội dung của tệp
            const spendData = JSON.parse(fs.readFileSync(downloadResult.pathSave, 'utf8'))

            if (spendData) {
                res.json({ success: true, message: 'Lấy dữ liệu thành công', data: spendData });
            } else {
                res.json({ success: false, message: 'Lấy dữ liệu thất bại', });
            }
        } catch (e) {
            logger.error(e)
            res.json({ success: false, message: 'Có lỗi khi lấy dữ liệu', });
        }
    },
}

// Cấu hình websocket
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    // Hàm độ trễ
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    console.log('Đã kết nối đến client')
    ws.on('close', function close() {
        console.log('Đã ngắt kết nối đến client');
    });

    // Nhận sự kiện đồng bộ dữ lệu từ client
    ws.on('message', async function (data) {
        const dataObj = JSON.parse(data)

        // Lấy tổng số tiến trình dữ liệu
        const totalProcess = dataObj.spendingItem.length + dataObj.spendingList.length;
        let currentProcess = 0;
        let successProcess = 0;

        // Kiểm tra danh sách
        for (const spendingList of dataObj.spendingList) {
            let sql = 'select * from spendinglist where id =? and namelist = ?';
            const checkList = await db.query(sql, [spendingList.id, spendingList.namelist]);

            // Nếu danh sách tồn tại
            if (checkList.length > 0) {
                // Lọc ra các chi tiêu của danh sách này từ dữ liệu sao lưu
                const filSpendItem = _.filter(dataObj.spendingItem, { 'spendlistid': spendingList.id });

                // Kiểm tra chi tiêu
                for (const spendingItem of filSpendItem) {
                    sql = 'select * from spendingitem where id =? and spendlistid = ? and nameitem = ?';
                    let params = [spendingItem.id, spendingItem.spendlistid, spendingItem.nameitem];
                    const checkItem = await db.query(sql, params)

                    // Nếu chi tiêu chưa tồn tại thì thêm mới
                    if (checkItem.length == 0) {
                        sql = `insert into spendingitem (id, spendlistid, nameitem, price, details, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?, ?, ?)`;
                        params = [spendingItem.id, spendingItem.spendlistid, spendingItem.nameitem, spendingItem.price, spendingItem.details, spendingItem.atcreate, spendingItem.atupdate, spendingItem.status];
                        await db.query(sql, params);

                        // Sau khi thêm dữ liệu, trả về tiến trình hoàn thành
                        currentProcess++
                        successProcess = Math.floor((currentProcess / totalProcess) * 100);
                        ws.send(JSON.stringify({ totalProcess, currentProcess, successProcess }));
                        await delay(100);
                    }
                }
            } else {
                // Nếu danh sách chưa tồn tại, tạo mới
                sql = 'insert into spendinglist (id, usersid, namelist, atcreate, atupdate, lastentry, status) values (?, ?, ?, ?, ?, ?, ?)';
                let params = [spendingList.id, spendingList.usersid, spendingList.namelist, spendingList.atcreate, spendingList.atupdate, spendingList.lastentry, spendingList.status];
                await db.query(sql, params);

                // Lấy ra Id của danh sách vừa thêm
                const spendListId = await db.lastInsertId();

                // Sau khi tạo xong, lọc ra item của danh sách từ dữ liệu sao lưu
                const filSpendItem = _.filter(dataObj.spendingItem, { 'spendlistid': spendingList.id });

                // Thêm các item vào danh sách
                for (const spendingItem of filSpendItem) {
                    sql = `insert into spendingitem (id, spendlistid, nameitem, price, details, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?, ?, ?)`;
                    params = [spendingItem.id, spendListId, spendingItem.nameitem, spendingItem.price, spendingItem.details, spendingItem.atcreate, spendingItem.atupdate, spendingItem.status];
                    await db.query(sql, params);

                    // Sau khi thêm dữ liệu, trả về tiến trình hoàn thành
                    currentProcess++
                    successProcess = Math.floor((currentProcess / totalProcess) * 100);
                    ws.send(JSON.stringify({ totalProcess, currentProcess, successProcess }));
                    await delay(100);
                }
            }
        }
        // Lưu thời gian đồng bộ vào tệp setting ini
        appIniConfigs.updateIniConfigs('Data', 'syncDate', myUtils.formatDateTime(new Date()));
        ws.send(JSON.stringify({ totalProcess, currentProcess, successProcess: 100 }));
    });
})

