const path = require('path');
const fs = require('fs');
const iniFilePath = path.join(__dirname, '../../appSettings.ini');

const defaultConfigs = {
    Data: { dbPath: ['default'] },
    App: {
        darkMode: ['light', 'dark', 'auto'],
        defaultPage: ['home', 'spending', 'statisc'],
        defaultAction: ['add', 'del', 'edit'],
        language: ['vi', 'en'],
        reminderDelete: ['true', 'false'],
        tooltip: ['true', 'false'],
        closeDefault: ['ask', 'quit', 'tray'],
        notifySpend: ['true', 'false'],
        startWithWindow: ['false', 'true'],
    }
};

// Đọc và chuyển đổi tệp cấu hình .ini thành một object
const iniObject = parseIni(fs.readFileSync(iniFilePath, 'utf8'));


// Đọc tệp cấu hình .ini
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


// Khởi tạo tệp cấu hình .ini
function initSetting() {
    let iniContent = '';

    for (const section in defaultConfigs) {
        iniContent += `[${section}]\n`;

        for (const key in defaultConfigs[section]) {
            iniContent += `${key}=${defaultConfigs[section][key][0]}\n`;
        }
        iniContent += '\n';
    }
    fs.writeFileSync(iniFilePath, iniContent, 'utf8');
}


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


// Hàm kiểm tra và cập nhật giá trị từ tệp .ini
function checkAndUpdateConfig() {
    for (const [group, configs] of Object.entries(defaultConfigs)) {
        for (const [name, options] of Object.entries(configs)) {
            const value = iniObject[group]?.[name];
            const validOptions = options;

            if (value !== undefined && validOptions && validOptions.includes(value)) {
                continue;
            }

            // Nếu giá trị không hợp lệ, cập nhật lại với giá trị mặc định
            updateSetting(name, options[0], group);
        }
    }
}

// Kiểm tra nếu têp cấu hình chưa tồn tại thì tạo mới
const settingExist = fs.existsSync(iniFilePath);
if (!settingExist) {
    initSetting();
}


// Gọi hàm để kiểm tra và cập nhật giá trị khi bắt đầu chương trình
checkAndUpdateConfig();


module.exports = {
    updateSetting,
    initSetting,
    dbPath: iniObject.Data.dbPath,
    iniFilePath,
    parseIni,
}
