const path = require('path');
const fs = require('fs');
const iniFilePath = path.join(__dirname, '../../appSettings.ini');

const defaultConfig = {
    Data: { dbPath: 'default' },
    App: {
        darkmode: 'light',
        defaultPage: 'home',
        defaultAction: 'add',
        language: 'vi',
        reminderDelete: true,
        tooltip: true,
        closeDefault: 'ask'
    }
};

// Khởi tạo cài đặt
function initSetting() {
    let iniContent = '';

    for (const section in defaultConfig) {
        iniContent += `[${section}]\n`;

        for (const key in defaultConfig[section]) {
            iniContent += `${key}=${defaultConfig[section][key]}\n`;
        }

        iniContent += '\n';
    }

    fs.writeFileSync(iniFilePath, iniContent, 'utf8');
}

const settingExist = fs.existsSync(iniFilePath);
if (!settingExist) {
    initSetting();
}

// Giải mã dữ liệu
function parseIni(data) {
    const config = {};
    let currentSection = '';

    const lines = data.split('\n');
    const keyValueRegex = /^\s*([^=]+?)\s*=\s*(.*?)\s*$/;

    lines.forEach(line => {
        line = line.trim();

        if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.substring(1, line.length - 1);
            config[currentSection] = {};
        } else {
            const match = line.match(keyValueRegex);

            if (match) {
                const [, key, value] = match;
                config[currentSection][key] = value;
            }
        }
    });

    return config;
}

// Đọc và chuyển đổi đổi tượng
const iniObject = parseIni(fs.readFileSync(iniFilePath, 'utf8'));

// Cập nhật giá trị cài đặt
function updateSetting(name, value, group) {

    if (iniObject[group] && iniObject[group][name] !== undefined) {
        // Chỉ cập nhật giá trị nếu thuộc tính tồn tại trong group
        iniObject[group][name] = value;

        // Ghi lại nội dung vào tệp
        let updatedIniContent = '';

        for (const section in iniObject) {
            updatedIniContent += `[${section}]\n`;

            for (const key in iniObject[section]) {
                updatedIniContent += `${key}=${iniObject[section][key]}\n`;
            }

            updatedIniContent += '\n';
        }

        fs.writeFileSync(iniFilePath, updatedIniContent, 'utf8');
        return true; // Trả về true nếu cập nhật thành công
    }

    return false; // Trả về false nếu không tìm thấy group hoặc name trong tệp
}

module.exports = {
    updateSetting,
    initSetting,
    dbPath: iniObject.Data.dbPath,
    iniFilePath,
    parseIni,
}
