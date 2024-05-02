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
            return res.json({ success: true, status: 200, message: "Lấy dữ liệu thành công", data: { iniObject: iniConfigs } });
        } catch (e) {
            logger.error(e);
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    editData: (req, res) => {
        try {
            const { name, value, group } = req.body;

            appIniConfigs.updateIniConfigs(group, name, value);
            return res.json({ success: true, status: 200, message: "Cập nhật caì đặt thành công" });
        } catch (e) {
            logger.error(e);
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    resetData: (req, res) => {
        try {
            // Tạo lại tệp cấu hình .ini để reset tất cả cài đặt
            appIniConfigs.createIniConfigs();
            return res.json({ success: true, status: 200, message: "Khôi phục tệp cấu hình thành công" });
        } catch (e) {
            logger.error(e);
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    checkLastEntry: async (req, res) => {
        try {
            // Lấy ngày hiện tại (yyyy-mm-dd)
            const today = new Date().toISOString().split('T')[0];
            const result = await db.query('SELECT COUNT(*) as count FROM spendinglist WHERE lastentry >= ?', [today])
            return res.json({ success: true, status: 200, message: "Lấy dữ liệu thành công", result: result[0].count });
        } catch (e) {
            logger.error(e);
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    checkSyncStatus: async (req, res) => {
        try {
            // Kiểm tra xem tệp refresh_token có tồn tại không
            if (fs.existsSync(path.join(folderAppConfigs, 'data', 'Token.json'))) {
                const emailGGDrive = appIniConfigs.getIniConfigs('emailGGDrive');
                const syncDate = appIniConfigs.getIniConfigs('syncDate');

                if (emailGGDrive != '', syncDate != '') {
                    return res.json({ status: true, status: 200, message: 'Đã đăng nhập vào tài khoản', data: { email: emailGGDrive, syncDate: syncDate } })
                } else {
                    return res.json({ status: false, status: 200, message: 'Chưa đăng nhập vào tài khoản' })
                }
            } else {
                return res.json({ status: false, status: 200, message: 'Chưa đăng nhập vào tài khoản' })
            }
        } catch (e) {
            logger.error(e);
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    backupData: async (req, res) => {
        try {
            const { token } = req.query;

            if (!token)
                return res.json({ success: false, status: 400, message: "Dữ liệu yêu cầu không hợp lệ" });

            // Xoá các file sao lưu trên ggdrive
            const listFiles = await ggDrive.getListFile()

            for (const files of listFiles.files) {
                console.log('Đã xoá tệp có Id: ' + files.id)
                await ggDrive.deleteFile(files.id)
            }

            // Lấy ra id người dùng
            const userId = await db.table.users.getId(token);

            // Lấy danh sách chi tiêu
            let sql = 'select * from spendinglist where usersid = ?';
            const spendList = await db.query(sql, [userId]);

            // Lấy ra các mục của danh sách chi tiêu
            sql = 'select * from spendingitem';
            const spendItem = await db.query(sql);

            // Lấy ra danh sách nhật ký
            sql = 'select * from noted';
            const noted = await db.query(sql);

            // Lấy ra danh sách thu nhập tháng
            sql = 'select * from income';
            const income = await db.query(sql);

            // Tạo biến obj chứa dữ liệu
            const dataObj = {
                spendingList: spendList,
                spendingItem: spendItem,
                noted: noted,
                income: income
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

            return res.json({ success: true, status: 200, message: "Sao lưu dữ liệu thành công" });
        } catch (e) {
            logger.error(e); res.json({ success: false });
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    syncData: async (req, res) => {
        try {
            ggDrive.setAuthen();

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
                    return res.json({ success: false, status: 404, message: 'Không tìm thấy tệp sao lưu' });
                }
            }

            // Sau khi đã có fileId, tiến hành tải về máy
            const downloadResult = await ggDrive.downloadFile(fileId, path.join(folderAppConfigs, 'data', 'SpendingData.json'));

            // Sau khi đã tải về, đọc nội dung của tệp
            const spendData = JSON.parse(fs.readFileSync(downloadResult.pathSave, 'utf8'))

            return res.json({ success: true, status: 200, message: 'Lấy dữ liệu thành công', data: spendData });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },
}

// Cấu hình websocket
const wss = new WebSocket.Server({ port: 3963 });

wss.on('connection', function connection(ws) {
    // Hàm độ trễ
    function delay() {
        return new Promise(resolve => setTimeout(resolve, 10));
    }

    // Nhận sự kiện đồng bộ dữ lệu từ client
    ws.on('message', async function (data) {
        try {
            const dataObj = JSON.parse(data)

            // Khởi tạo một mảng để lưu các giá trị chưa có trong database
            var dataNotExist = { spendingList: [], spendingItem: [], noted: [], income: [] };

            // Kiểm tra spendingList
            for (const spendingList of dataObj.spendingList) {
                let sql = 'select * from spendinglist where id =? and namelist = ?';
                const checkList = await db.query(sql, [spendingList.id, spendingList.namelist]);

                // Thêm danh sách vào mảng nếu nó chưa tồn tại
                if (checkList.length == 0) { dataNotExist.spendingList.push(spendingList); }

                // Kiểm tra spendingItem
                for (const spendingItem of dataObj.spendingItem) {
                    sql = 'select * from spendingitem where id =? and spendlistid = ? and nameitem = ?';
                    const checkItem = await db.query(sql, [spendingItem.id, spendingList.id, spendingItem.nameitem]);

                    // Nếu Item vào mảng nếu nó chưa tồn tại
                    if (checkItem.length == 0) { dataNotExist.spendingItem.push(spendingItem); }
                }
            }

            // Kiểm tra noted
            for (const noted of dataObj.noted) {
                let sql = 'select * from noted where id =? and namelist = ?';
                const checkNoted = await db.query(sql, [noted.id, noted.namelist]);

                // Thêm vào mảng nếu nó chưa tồn tại
                if (checkNoted.length == 0) { dataNotExist.noted.push(noted); }
            }

            // Kiểm tra income
            for (const income of dataObj.income) {
                let sql = 'select * from noted where id = ? and spendlistid = ? and price = ?';
                const checkIncome = await db.query(sql, [income.id, income.spendlistid, income.price])

                // Thêm vào mảng nếu nó chưa tồn tại
                if (checkIncome.length == 0) { dataNotExist.income.push(income) }
            }

            // Lấy tổng số tiến trình dữ liệu
            const totalProcess = dataNotExist.spendingItem.length + dataNotExist.spendingList.length + dataNotExist.noted.length;
            let currentProcess = 0;
            let successProcess = 0;

            // hàm tính tổng tiến trình hiện tại
            async function calculateProcess() {
                currentProcess++
                successProcess = Math.floor((currentProcess / totalProcess) * 100);
                ws.send(JSON.stringify({ totalProcess, currentProcess, successProcess }));
            }

            // Lấy ra người dùng hiện tại
            const userId = await db.table.users.getId(dataObj.token)

            // Sau khi đã kiểm tra xong, tiến hành lặp qua dữ liệu và thêm vào database
            if (dataNotExist.spendingList.length > 0) {
                // Thêm spendingList
                for (const spendList of dataNotExist.spendingList) {
                    let sql = 'insert into spendinglist (usersid, namelist, atcreate, atupdate, lastentry, status) values (?, ?, ?, ?, ?, ?)';
                    let params = [userId, spendList.namelist, spendList.atcreate, spendList.atupdate, spendList.lastentry, spendList.status];
                    await db.query(sql, params);

                    // Lấy ra Id của danh sách vừa thêm
                    const spendListId = await db.lastInsertId();

                    // Lọc ra các item của danh sách
                    const filSpendItem = _.filter(dataNotExist.spendingItem, { 'spendlistid': spendList.id });

                    // Thêm spendingItem
                    for (const spendItem of filSpendItem) {
                        sql = `insert into spendingitem (spendlistid, nameitem, price, details, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?, ?)`;
                        params = [spendListId, spendItem.nameitem, spendItem.price, spendItem.details, spendItem.atcreate, spendItem.atupdate, spendItem.status];
                        await db.query(sql, params);

                        // Sau khi thêm dữ liệu, trả về tiến trình hoàn thành
                        calculateProcess();
                        await delay(); // Độ trễ trước khi thực hiện tiếp
                    }
                }
            } else {
                // Nếu không có spendingList, thêm các spendingItem
                for (const spendItem of dataNotExist.spendingItem) {
                    sql = `insert into spendingitem (spendlistid, nameitem, price, details, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?, ?)`;
                    params = [spendItem.spendlistid, spendItem.nameitem, spendItem.price, spendItem.details, spendItem.atcreate, spendItem.atupdate, spendItem.status];
                    await db.query(sql, params);

                    // Sau khi thêm dữ liệu, trả về tiến trình hoàn thành
                    calculateProcess();
                    await delay(); // Độ trễ trước khi thực hiện tiếp
                }
            }

            // Thêm noted
            if (dataNotExist.noted.length > 0) {
                for (const noted of dataNotExist.noted) {
                    let sql = 'insert into noted (usersid, namelist, content, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?)';
                    await db.query(sql, [noted.usersid, noted.namelist, noted.content, noted.atcreate, noted.atupdate, noted.status]);

                    // Sau khi thêm dữ liệu, trả về tiến trình hoàn thành
                    calculateProcess();
                    await delay(); // Độ trễ trước khi thực hiện tiếp
                }
            }

            // Thêm income
            if (dataNotExist?.income?.length > 0) {
                for (const income of dataNotExist.income) {
                    let sql = 'insert into income (spendlistid, price, atcreate, atupdate, status) values (?, ?, ?, ?, ?)';
                    await db.query(sql, [income.spendlistid, income.price, income.atcreate, income.atupdate, income.status]);

                    // Sau khi thêm dữ liệu, trả về tiến trình hoàn thành
                    calculateProcess();
                    await delay(); // Độ trễ trước khi thực hiện tiếp
                }
            }

            // Lưu thời gian đồng bộ vào tệp setting ini
            appIniConfigs.updateIniConfigs('Data', 'syncDate', myUtils.formatDateTime(new Date()));
            ws.send(JSON.stringify({ totalProcess, currentProcess, successProcess: 100 }));
        } catch (e) {
            logger.error(e);
        }
    });
})