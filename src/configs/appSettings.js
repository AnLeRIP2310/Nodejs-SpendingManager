const path = require('path');
const fs = require('fs');
const { logError } = require('./logError');

var iniFilePath;

if (process.platform === 'win32') {
    iniFilePath = process.env.USERPROFILE + '/documents/SpendingManager/appSettings.ini';
} else if (process.platform === 'darwin') {
    iniFilePath = process.env.HOME + '/Documents/SpendingManager/appSettings.ini';
}


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


// Hàm ghi lại nội dung vào tệp
function writeIniFile(content) {
    fs.writeFileSync(iniFilePath, content, 'utf8');
}

// Hàm tạo nội dung của tệp ini
function generateIniContent(objSetting, type) {
    let updatedIniContent = '';

    for (const section in objSetting) {
        updatedIniContent += `[${section}]\n`;

        if (type == 'default') {
            for (const key in objSetting[section]) {
                updatedIniContent += `${key}=${objSetting[section][key][0]}\n`;
            }
        } else {
            for (const key in objSetting[section]) {
                updatedIniContent += `${key}=${objSetting[section][key]}\n`;
            }
        }
        updatedIniContent += '\n';
    }
    return updatedIniContent;
}

// Khởi tạo tệp cấu hình .ini
function initSetting() {
    // Kiểm tra và tạo thư mục nếu chưa có
    if (!fs.existsSync(path.dirname(iniFilePath))) {
        try {
            fs.mkdirSync(path.dirname(iniFilePath), { recursive: true });
            console.log('Thư mục đã được tạo.');

            // Khởi tạo tệp cài đặt
            writeIniFile(generateIniContent(defaultConfigs, 'default'));
        } catch (err) {
            console.error('Lỗi khi tạo thư mục:', err);
            logError(err); // Ghi vào nhật kí lỗi
        }
    }
}

// Kiểm tra nếu têp cấu hình chưa tồn tại thì tạo mới
const settingExist = fs.existsSync(iniFilePath);
if (!settingExist) {
    initSetting();
}

// Đọc và chuyển đổi tệp cấu hình .ini thành một object
const iniObject = parseIni(fs.readFileSync(iniFilePath, 'utf8'));


// Cập nhật giá trị cài đặt
function updateSetting(name, value, group) {
    if (iniObject[group] && iniObject[group][name] !== undefined) {
        // Chỉ cập nhật giá trị nếu thuộc tính tồn tại trong group
        iniObject[group][name] = value;

        // Ghi lại nội dung vào tệp
        writeIniFile(generateIniContent(iniObject));
        return true;
    }
    return false;
}

// Hàm thêm setting bị thiếu vào tệp ini
function addSetting(name, value, group) {
    if (iniObject[group]) {
        // Nếu group đã tồn tại trong tệp .ini, thêm setting mới vào
        iniObject[group][name] = value;
    } else {
        // Nếu group không tồn tại, tạo mới group và thêm setting vào
        iniObject[group] = { [name]: value };
    }

    // Ghi lại nội dung vào tệp
    writeIniFile(generateIniContent(iniObject));
}

// Hàm kiểm tra và cập nhật giá trị từ tệp .ini
function checkAndFixIniConfigs() {
    for (const [group, configs] of Object.entries(defaultConfigs)) {
        for (const [name, options] of Object.entries(configs)) {
            const value = iniObject[group]?.[name];
            const validOptions = options;

            if (value === undefined) {
                // Nếu giá trị không tồn tại trong tệp .ini, tạo lại với giá trị mặc định
                console.log(`Giá trị của ${group}.${name} bị thiếu. Đặt lại mặt định`);
                addSetting(name, options[0], group);
            } else if (validOptions && validOptions.includes(value)) {
                // Nếu giá trị hợp lệ, bỏ qua
                continue;
            } else if (!defaultConfigs[group]?.[name]) {
                // Nếu cài đặt không tồn tại trong defaultConfigs, xoá giá trị đó
                console.log(`Giá trị của ${group}.${name} không tồn tại trong defaultConfigs. Xoá giá trị này.`);
                delete iniObject[group][name];
            } else {
                // Nếu giá trị không hợp lệ, cập nhật lại với giá trị mặc định
                console.log(`Giá trị của ${group}.${name} là không hợp lệ. Đặt lại mặt định: ${options[0]}`);
                updateSetting(name, options[0], group);
            }
        }
    }

    // Kiểm tra và xoá các cài đặt không tồn tại trong defaultConfigs
    for (const group in iniObject) {
        for (const name in iniObject[group]) {
            if (!defaultConfigs[group]?.[name]) {
                // Nếu cài đặt không tồn tại trong defaultConfigs, xoá giá trị đó
                console.log(`Giá trị của ${group}.${name} không tồn tại trong defaultConfigs. Xoá giá trị này.`);
                delete iniObject[group][name];
            }
        }
        // Kiểm tra và xoá các group không tồn tại trong defaultConfigs
        if (!defaultConfigs[group]) {
            console.log(`Group ${group} không tồn tại trong defaultConfigs. Xoá group này.`);
            delete iniObject[group];
        }
    }
    // Ghi lại nội dung vào tệp
    writeIniFile(generateIniContent(iniObject));
} checkAndFixIniConfigs();



module.exports = {
    updateSetting,
    initSetting,
    dbPath: iniObject.Data.dbPath,
    iniFilePath,
    parseIni,
}
