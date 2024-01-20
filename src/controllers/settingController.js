const appSettings = require('../configs/appSettings');
const fs = require('fs');
const { dbPath, defaultDbPath } = require('../configs/db');

module.exports = {
    getData: function (req, res) {
        // Đọc và chuyển đổi đổi tượng
        const iniObject = appSettings.parseIni(fs.readFileSync(appSettings.iniFilePath, 'utf8'));

        res.json({
            dbPath: dbPath,
            iniObject,
        });
    },

    editData: function (req, res) {
        const { name, value, group } = req.body;

        const result = appSettings.updateSetting(name, value, group);

        if (result) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    },

    resetData: function (req, res) {
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
}