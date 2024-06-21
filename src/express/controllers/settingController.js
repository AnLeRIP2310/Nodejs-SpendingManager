const appIniConfigs = require('../../configs/appIniConfigs');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const db = require('../../configs/db');
const logger = require('../../configs/logger');
const ggDrive = require('../../configs/ggDrive');
const myUtils = require('../../configs/myUtils');
const _ = require('lodash');
const zlib = require('zlib');
ggDrive.setAuthen();



// Lấy ra đường dẫn đến thư mục cấu hình của ứng dụng
const folderAppConfigs = appIniConfigs.getfolderAppConfigs();

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
                const driveEmail = appIniConfigs.getIniConfigs('driveEmail');
                const backupDate = appIniConfigs.getIniConfigs('backupDate');

                if (driveEmail != '' && backupDate != '') {
                    return res.json({ success: true, status: 200, message: 'Đã đăng nhập vào tài khoản', data: { email: driveEmail, backupDate: backupDate } })
                } else {
                    return res.json({ success: false, status: 200, message: 'Chưa đăng nhập vào tài khoản' })
                }
            } else {
                return res.json({ success: false, status: 200, message: 'Chưa đăng nhập vào tài khoản' })
            }
        } catch (e) {
            logger.error(e);
            return res.json({ success: false, status: 500, message: "Lỗi máy chủ nội bộ" });
        }
    },

    backupData: async (req, res) => {
        try {
            // Xoá các file sao lưu cũ trên ggdrive
            const allFiles = await ggDrive.getAllFiles()
            for (const files of allFiles.files) {
                await ggDrive.deleteFile(files.id)
                console.log('Đã xoá tệp có Id: ' + files.id)
            }

            // Thực hiện truy vấn lấy dữ liệu cần sao lưu
            const queries = [
                db.query('SELECT * FROM spendinglist'),
                db.query('SELECT * FROM spendingitem Order By atupdate'),
                db.query('SELECT * FROM noted'),
                db.query('SELECT * FROM income')
            ];
            const [spendList, spendItem, noted, income] = await Promise.all(queries);

            const dataObj = {};
            if (spendList.length > 0) dataObj.spendingList = spendList;
            if (spendItem.length > 0) dataObj.spendingItem = spendItem;
            if (noted.length > 0) dataObj.noted = noted;
            if (income.length > 0) dataObj.income = income;

            // Nén dữ liệu JSON và chuyển đổi kiểu buffer thành stream
            const jsonData = zlib.gzipSync(JSON.stringify(dataObj, null, 2));
            const jsonDataStream = myUtils.bufferToStream(jsonData);

            // Upload tệp lên drive
            const resultUpload = await ggDrive.uploadFile('spendingData.json.gz', jsonDataStream, 'application/gzip');

            // Lưu id tệp và ngày sao lưu vài cấu hình .ini
            if (resultUpload) {
                appIniConfigs.updateIniConfigs('Data', 'driveFileId', resultUpload.data.id);
                appIniConfigs.updateIniConfigs('Data', 'backupDate', myUtils.formatDateTime(new Date()));
            }
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
            var fileId = appIniConfigs.getIniConfigs('driveFileId');

            // Kiểm tra biến fileId
            if (!fileId) {
                const getAllFiles = await ggDrive.getAllFiles();

                if (getAllFiles?.files?.length > 0) {
                    const lastFileId = getAllFiles.files.length - 1
                    fileId = getAllFiles.files[lastFileId].lastInsertId
                } else {
                    // Trường hợp chưa có bất kì file nào thì trả về kết quả
                    return res.json({ success: false, status: 404, message: 'Không tìm thấy tệp sao lưu' });
                }
            } else {
                // Kiểm tra xem fileId này có tồn tại trên drive không
                const file = await ggDrive.getFileById(fileId);

                // Nếu không tồn tại thì lấy ra một cái mới nhất từ drive
                if (!file.success && file.status == 404) {
                    const getAllFiles = await ggDrive.getAllFiles();

                    if (getAllFiles?.files?.length > 0) {
                        const lastFileId = getAllFiles.files.length - 1
                        fileId = getAllFiles.files[lastFileId].lastInsertId
                    } else {
                        // Trường hợp chưa có bất kì file nào thì trả về kết quả
                        return res.json({ success: false, status: 404, message: 'Không tìm thấy tệp sao lưu' });
                    }
                }
            }

            // Lưu fileId vào setting .ini để sử dụng sau này
            appIniConfigs.updateIniConfigs('Data', 'driveFileId', fileId);

            // Sau khi đã có fileId, tiến hành tải về máy
            const downResult = await ggDrive.downloadFile(fileId, path.join(folderAppConfigs, 'data', 'SpendingData.json'));

            // Đọc và trả về dữ liệu JSON sau đó xoá nó đi
            const spendData = fs.readFileSync(downResult.pathSave, 'utf8');
            fs.unlinkSync(downResult.pathSave);
            return res.json({ success: true, status: 200, message: 'Lấy dữ liệu thành công', data: spendData });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },
}

function startWSS(port) {
    const wss = new WebSocket.Server({ port: port }, () => {
        console.log('Websocket server bắt đầu trên cổng ' + port);
    });

    wss.on('connection', function connection(ws) {
        // Hàm độ trễ
        function delay() {
            return new Promise(resolve => setTimeout(resolve, 10));
        }

        // Nhận sự kiện đồng bộ dữ lệu từ client
        ws.on('message', async function (data) {
            try {
                const dataObj = JSON.parse(data);

                // Khởi tạo một mảng để lưu các giá trị chưa có trong database
                const dataNotExist = { spendingList: [], spendingItem: [], noted: [], income: [] };

                // Kiểm tra spendingList
                if (dataObj?.spendingList?.length)
                    for (const spendingList of dataObj.spendingList) {
                        let sql = 'select * from spendinglist where id =? and namelist = ?';
                        const checkList = await db.query(sql, [spendingList.id, spendingList.namelist]);

                        // Thêm danh sách vào mảng nếu nó chưa tồn tại
                        if (checkList.length == 0) { dataNotExist.spendingList.push(spendingList); }

                        // Kiểm tra spendingItem
                        if (dataObj?.spendingItem?.length)
                            for (const spendingItem of dataObj.spendingItem) {
                                sql = 'select * from spendingitem where id =? and spendlistid = ? and nameitem = ?';
                                const checkItem = await db.query(sql, [spendingItem.id, spendingList.id, spendingItem.nameitem]);

                                // Nếu Item vào mảng nếu nó chưa tồn tại
                                if (checkItem.length == 0) { dataNotExist.spendingItem.push(spendingItem); }
                            }
                    }

                // Kiểm tra noted
                if (dataObj?.noted?.length)
                    for (const noted of dataObj.noted) {
                        let sql = 'select * from noted where id =? and namelist = ?';
                        const checkNoted = await db.query(sql, [noted.id, noted.namelist]);

                        // Thêm vào mảng nếu nó chưa tồn tại
                        if (checkNoted.length == 0) { dataNotExist.noted.push(noted); }
                    }

                // Kiểm tra income
                if (dataObj?.income?.length)
                    for (const income of dataObj.income) {
                        let sql = 'select * from income where id = ? and spendlistid = ? and price = ?';
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

                // Sau khi đã kiểm tra xong, tiến hành lặp qua dữ liệu và thêm vào database
                if (dataNotExist.spendingList.length > 0) {
                    // Thêm spendingList
                    for (const spendList of dataNotExist.spendingList) {
                        let sql = 'insert into spendinglist (namelist, atcreate, atupdate, lastentry, status) values (?, ?, ?, ?, ?)';
                        let params = [spendList.namelist, spendList.atcreate, spendList.atupdate, spendList.lastentry, spendList.status];
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
                        let sql = `insert into spendingitem (spendlistid, nameitem, price, details, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?, ?)`;
                        let params = [spendItem.spendlistid, spendItem.nameitem, spendItem.price, spendItem.details, spendItem.atcreate, spendItem.atupdate, spendItem.status];
                        await db.query(sql, params);

                        // Sau khi thêm dữ liệu, trả về tiến trình hoàn thành
                        calculateProcess();
                        await delay(); // Độ trễ trước khi thực hiện tiếp
                    }
                }

                // Thêm noted
                if (dataNotExist?.noted?.length) {
                    for (const noted of dataNotExist.noted) {
                        let sql = 'insert into noted (namelist, content, atcreate, atupdate, status) values (?, ?, ?, ?, ?)';
                        await db.query(sql, [noted.namelist, noted.content, noted.atcreate, noted.atupdate, noted.status]);

                        // Sau khi thêm dữ liệu, trả về tiến trình hoàn thành
                        calculateProcess();
                        await delay(); // Độ trễ trước khi thực hiện tiếp
                    }
                }

                // Thêm income
                if (dataNotExist?.income?.length) {
                    for (const income of dataNotExist.income) {
                        let sql = 'insert into income (spendlistid, price, atcreate, atupdate, status) values (?, ?, ?, ?, ?)';
                        await db.query(sql, [income.spendlistid, income.price, income.atcreate, income.atupdate, income.status]);

                        // Sau khi thêm dữ liệu, trả về tiến trình hoàn thành
                        calculateProcess();
                        await delay(); // Độ trễ trước khi thực hiện tiếp
                    }
                }

                // Lưu thời gian đồng bộ vào tệp setting ini
                appIniConfigs.updateIniConfigs('Data', 'backupDate', myUtils.formatDateTime(new Date()));
                ws.send(JSON.stringify({ totalProcess, currentProcess, successProcess: 100 }));
            } catch (e) {
                logger.error(e);
            }
        });
    });

    wss.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} đã được sử dụng. Thử một port mới...`);
            // startWSS(port + 1); // Thử mở trên một cổng khác
        } else {
            console.error('WebSocket Lỗi server:', err);
        }
    });
}

startWSS(3963);