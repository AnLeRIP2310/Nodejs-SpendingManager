const appIniConfigs = require('../../configs/appIniConfigs');
const fs = require('fs');
const path = require('path');
const db = require('../../configs/db');
const logger = require('../../configs/logger');
const ggDrive = require('../../configs/ggDrive');
const myUtils = require('../../configs/myUtils');
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

            if (fileId != '') {
                // Nếu fileId tồn tại trong tệp ini thì tiến hành lấy ra id đó để xoá tệp trên ggdrive
                await ggDrive.deleteFile(fileId);
            }

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
            appIniConfigs.updateIniConfigs('Data', 'syncDate', myUtils.formatDate(new Date()));

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

                // Nếu có tệp
                if (getFileId.files) {
                    // Kiểm tra xem có tệp tin nào không
                    if (getFileId.files.length > 0) {
                        // Lấy ra giá trị cuối cùng của mảng
                        const lastFileId = getFileId.files.length - 1
                        fileId = getFileId.files[lastFileId].id

                        // Lưu fileId vào setting ini để sử dụng sau này
                        appIniConfigs.updateIniConfigs('Data', 'fileGGDriveId', fileId);
                        appIniConfigs.updateIniConfigs('Data', 'syncDate', myUtils.formatDate(new Date()));
                    } else {
                        // Trường hợp chưa có bất kì file nào thì trả về kết quả
                        res.json({ success: false, message: 'Không tìm thấy tệp sao lưu' })
                    }
                }
            }

            if (fileId == '') {
                return;
            }

            // Sau khi đã có fileId, tiến hành tải về máy
            const downloadResult = await ggDrive.downloadFile(fileId, path.join(folderAppConfigs, 'data', 'SpendingData.json'));

            // Sau khi đã tải về, đọc nội dung của tệp
            const spendData = JSON.parse(fs.readFileSync(downloadResult.pathSave, 'utf8'))

            // Khởi tạo một biến để lưu các giá trị chưa có trong database
            var dataNotExist = {
                spendingList: [],
                spendingItem: []
            };

            // Lấy dữ liệu spendingList từ database để tiến hành so sánh
            for (const spendList of spendData.spendingList) {
                var sql = 'select * from spendinglist where id = ? and namelist = ? and atcreate = ?';
                var params = [spendList.id, spendList.namelist, spendList.atcreate];
                const result = await db.query(sql, params);

                // Nếu không tồn tại thì thêm vào biến dataNotExist
                if (result.length == 0) {
                    dataNotExist.spendingList.push(spendList);
                }
            }

            // Lấy dữ liệu spendingItem từ database để tiến hành so sánh
            for (const spendItem of spendData.spendingItem) {
                var sql = `select * from spendingitem where id = ? and spendlistid = ? and nameitem = ? 
                    and price = ? and details = ? and atcreate = ?`;
                var params = [spendItem.id, spendItem.spendlistid, spendItem.nameitem, spendItem.price, spendItem.details, spendItem.atcreate];

                const result = await db.query(sql, params);

                // Nếu không tồn tại thì thêm vào biến dataNotExist
                if (result.length == 0) {
                    dataNotExist.spendingItem.push(spendItem);
                }
            }

            // Sau khi chạy xong vòng lặp và lấy được các dữ liệu cần đồng bộ thì trả về client
            res.json({
                success: true,
                message: 'Đã lấy ra danh sách cần đóng bộ',
                data: dataNotExist
            });
        } catch (e) {
            logger.error(e)
        }
    },

    handleSyncSpendList: async (req, res) => {
        const { token, namelist, atcreate, status, lastentry } = req.body;

        try {
            const userId = await db.table.users.getId(token);

            var sql = 'insert into spendinglist (usersid, namelist, atcreate, status, lastentry) values (?, ?, ?, ?, ?)';
            var params = [userId, namelist, atcreate, status, lastentry];
            const result = await db.query(sql, params);
            res.json({ success: result })
        } catch (e) {
            logger.error(e)
        }
    },

    handleSyncSpendItem: async (req, res) => {
        const { spendlistid, nameitem, price, details, atcreate, atupdate, status } = req.body;

        try {
            var sql = 'insert into spendingitem (spendlistid, nameitem, price, details, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?, ?)';
            var params = [spendlistid, nameitem, price, details, atcreate, atupdate, status];
            const result = await db.query(sql, params);
            res.json({ success: result })
        } catch (e) {
            logger.error(e)
        }
    },
}