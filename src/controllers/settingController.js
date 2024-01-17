const settingsApp = require('../configs/appSettings');
const fs = require('fs');
const { dbPath, defaultDbPath } = require('../configs/db');

module.exports = {
    getData: function (req, res) {
        // Đọc và chuyển đổi đổi tượng
        const iniObject = settingsApp.parseIni(fs.readFileSync(settingsApp.iniFilePath, 'utf8'));

        var desktopSetting = {
            darkmode: iniObject.App.darkmode,
            defaultPage: iniObject.App.defaultPage,
            defaultAction: iniObject.App.defaultAction,
            language: iniObject.App.language,
            reminderDelete: iniObject.App.reminderDelete,
            tooltip: iniObject.App.tooltip,
        }

        res.json({
            desktopSetting: desktopSetting,
            dbPath: dbPath,
        });
    },

    editData: function (req, res) {
        const { name, value, group } = req.body;

        const result = settingsApp.updateSetting(name, value, group);

        if (result) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    },

    resetData: function (req, res) {
        if (settingsApp.dbPath != 'default') {
            // sao chép database về vị trí mặt định
            fs.copyFileSync(defaultDbPath, dbPath);

            settingsApp.initSetting();
            res.json({ success: true, action: 'reload' });
        } else {
            settingsApp.initSetting();
            res.json({ success: true });
        }
    },
}