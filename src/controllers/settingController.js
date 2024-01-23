const appSettings = require('../configs/appSettings');
const fs = require('fs');
const { dbPath, defaultDbPath, query } = require('../configs/db');
const { logError } = require('../configs/logError')


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
            logError(e)
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
            logError(e)
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
            logError(e)
        }
    }
}