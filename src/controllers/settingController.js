const appSettings = require('../configs/appSettings');
const fs = require('fs');
const { dbPath, defaultDbPath, query, getUserId } = require('../configs/db');
const errorLogs = require('../configs/errorLogs')
const ggDrive = require('../configs/ggDrive');
const myUtils = require('../configs/myUtils');
ggDrive.setAuthen();




// Đường dẫn đến thư mục lưu trữ
var pathSettingFolder;
if (process.platform === 'win32') { pathSettingFolder = process.env.USERPROFILE + '/Documents/SpendingManager/'; }
else if (process.platform === 'darwin') { pathSettingFolder = process.env.HOME + '/Documents/SpendingManager/'; }







module.exports = {
    getData: (req, res) => {
        // Đọc và chuyển đổi đổi tượng
        try {
            const iniObject = appSettings.parseIni(fs.readFileSync(appSettings.iniFilePath, 'utf8'));

            res.json({
                dbPath: dbPath,
                iniObject,
            });
        } catch (e) {
            console.log(e)
            errorLogs(e)
        }
    },

    editData: (req, res) => {
        const { name, value, group } = req.body;

        try {
            const result = appSettings.updateSetting(name, value, group);

            if (result) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        } catch (e) {
            console.log(e)
            errorLogs(e)
        }
    },

    resetData: (req, res) => {
        if (appSettings.dbPath != 'default') {
            // sao chép database về vị trí mặt định
            fs.copyFileSync(defaultDbPath, dbPath);

            appSettings.initSetting();
            res.json({ success: true, action: 'reload' });
        } else {
            appSettings.initSetting();
            res.json({ success: true });
        }
    },

    checkLastEntry: async (req, res) => {
        try {
            // Lấy ngày hiện tại (yyyy-mm-dd)
            const today = new Date().toISOString().split('T')[0];

            var sql = 'SELECT COUNT(*) as count FROM spendinglist WHERE lastentry >= ?'
            const result = await query(sql, [today])

            res.json({ success: true, result: result[0].count });
        } catch (e) {
            console.log(e)
            errorLogs(e)
        }
    },

    checkSyncStatus: async (req, res) => {
        // Kiểm tra xem tệp refresh_token có tồn tại không
        if (fs.existsSync(pathSettingFolder + 'data/Token.json')) {
            const iniObject = appSettings.parseIni(fs.readFileSync(appSettings.iniFilePath, 'utf8'));

            const emailGGDrive = iniObject.Data.emailGGDrive;
            const syncDate = iniObject.Data.syncDate;

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
            var fileId = appSettings.getValueSetting('fileGGDriveId', 'Data');

            if (fileId != '') {
                // Nếu fileId tồn tại trong tệp ini thì tiến hành lấy ra id đó để xoá tệp trên ggdrive
                await ggDrive.deleteFile(fileId);
            }

            // Lấy ra id người dùng
            const userId = await getUserId(token);

            // Lấy danh sách chi tiêu
            var sql = 'select * from spendinglist where usersid = ?';
            const spendList = await query(sql, [userId]);

            // Lấy ra các mục của danh sách chi tiêu
            sql = 'select * from spendingitem';
            const spendItem = await query(sql);

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
                appSettings.updateSetting('fileGGDriveId', resultUpload.data.id, 'Data');
            }

            // Lưu ngày sao lưu vào settings ini
            appSettings.updateSetting('syncDate', myUtils.formatDate(new Date()), 'Data');

            res.json({ success: true });
        } catch (e) {
            errorLogs(e); res.json({ success: false });
        }
    },

    syncData: async (req, res) => {
        ggDrive.setAuthen();

        try {
            // Lấy ra fileId trong cài dặt
            var fileId = appSettings.parseIni(fs.readFileSync(appSettings.iniFilePath, 'utf8')).Data.fileGGDriveId;

            // Nếu fileId không tồn tại thì lấy ra fileId từ ggDrive
            if (fileId == '' || fileId == 'null' || fileId == 'undefined') {
                const getFileId = await ggDrive.getListFile()

                // Kiểm tra xem có tệp tin nào không
                if (getFileId.files.length > 0) {
                    // Lấy ra giá trị cuối cùng của mảng
                    const lastFileId = getFileId.files.length - 1
                    fileId = getFileId.files[lastFileId].id

                    // Lưu fileId vào setting ini để sử dụng sau này
                    appSettings.updateSetting('fileGGDriveId', fileId, 'Data');
                    appSettings.updateSetting('syncDate', myUtils.formatDate(new Date()), 'Data');
                } else {
                    // Trường hợp chưa có bất kì file nào thì trả về kết quả
                    res.json({ success: false, message: 'Không tìm thấy tệp sao lưu' })
                }
            }

            if (fileId == '') {
                return;
            }

            // Sau khi đã có fileId, tiến hành tải về máy
            const downloadResult = await ggDrive.downloadFile(fileId, pathSettingFolder + 'data/SpendingData.json');

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
                const result = await query(sql, params);

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

                const result = await query(sql, params);

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
            errorLogs(e)
        }
    },

    handleSyncSpendList: async (req, res) => {
        const { token, namelist, atcreate, status, lastentry } = req.body;

        try {
            const userId = await getUserId(token);

            var sql = 'insert into spendinglist (usersid, namelist, atcreate, status, lastentry) values (?, ?, ?, ?, ?)';
            var params = [userId, namelist, atcreate, status, lastentry];
            const result = await query(sql, params);
            res.json({ success: result })
        } catch (e) {
            errorLogs(e)
        }
    },

    handleSyncSpendItem: async (req, res) => {
        const { spendlistid, nameitem, price, details, atcreate, atupdate, status } = req.body;

        try {
            var sql = 'insert into spendingitem (spendlistid, nameitem, price, details, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?, ?)';
            var params = [spendlistid, nameitem, price, details, atcreate, atupdate, status];
            const result = await query(sql, params);
            res.json({ success: result })
        } catch (e) {
            errorLogs(e)
        }
    },
}