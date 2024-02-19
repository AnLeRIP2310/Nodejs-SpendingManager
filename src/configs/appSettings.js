const path = require('path');
const fs = require('fs');
const errorLogs  = require('./errorLogs');

var iniFilePath;

if (process.platform === 'win32') {
    iniFilePath = process.env.USERPROFILE + '/Documents/SpendingManager/appSettings.ini';
} else if (process.platform === 'darwin') {
    iniFilePath = process.env.HOME + '/Documents/SpendingManager/appSettings.ini';
}

// Khai báo cấu hình mặt định
const defaultConfigs = {
    Data: {
        dbPath: ['default'],
        fileGGDriveId: [''],
        emailGGDrive: [''],
        syncDate: [''],
    },
    App: {
        darkMode: ['light', 'dark', 'auto'],
        defaultPage: ['home', 'spending', 'statisc', 'noted'],
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
    // Kiểm tra xem tệp cấu hình đã tồn tại hay chưa
    const settingExist = fs.existsSync(iniFilePath);
    // Nếu tệp cấu hình chưa tồn tại
    if (!settingExist) {
        try {
            // Tạo thư mục chứa tệp cấu hình 
            fs.mkdirSync(path.dirname(iniFilePath), { recursive: true });
            console.log('Thư mục đã được tạo.');

            // Khởi tạo tệp cấu hình với nội dung mặc định
            writeIniFile(generateIniContent(defaultConfigs, 'default'));
        } catch (err) {
            errorLogs(err, 'Lỗi khi tạo thư mục'); // Ghi vào nhật kí lỗi
        }
    }
} initSetting();


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


// Hàm kiểm tra giá trị và sửa nếu có lỗi
function validateConfigFile(iniObject, exceptions = []) {
    const isExempt = (group, name) => exceptions.includes(name);

    for (const group in defaultConfigs) {
        for (const name in defaultConfigs[group]) {
            if (isExempt(group, name)) {
                // console.log(`[Ngoại lệ] Cài đặt "${name}" trong phần "${group}" được bỏ qua.`);

                // Kiểm tra và tái tạo giá trị nếu tên của cài đặt bị xoá
                if (!iniObject[group]?.hasOwnProperty(name)) {
                    console.log(`[Thiếu] Giá trị của ${group}.${name} bị thiếu. Đặt lại mặt định.`);
                    addSetting(name, '', group); // Gán giá trị rỗng
                }
                continue;
            }

            const value = iniObject[group]?.[name];
            const validOptions = defaultConfigs[group][name];

            if (value === undefined) {
                console.log(`[Thiếu] Giá trị của ${group}.${name} bị thiếu. Đặt lại mặt định.`);
                addSetting(name, validOptions[0], group);
            } else if (validOptions && validOptions.includes(value)) {
                continue;
            } else if (!defaultConfigs[group]?.[name]) {
                console.log(`[Dư thừa] Giá trị của ${group}.${name} không tồn tại trong defaultConfigs. Xoá giá trị này.`);
                delete iniObject[group][name];
            } else {
                console.log(`[Không hợp lệ] Giá trị của ${group}.${name} là không hợp lệ. Đặt lại mặt định: ${validOptions[0]}`);
                updateSetting(name, validOptions[0], group);
            }
        }
    }

    for (const group in iniObject) {
        for (const name in iniObject[group]) {
            if (!defaultConfigs[group]?.[name]) {
                console.log(`[Dư thừa] Giá trị của ${group}.${name} không tồn tại trong defaultConfigs. Xoá giá trị này.`);
                delete iniObject[group][name];
            }
        }

        if (!defaultConfigs[group]) {
            console.log(`[Dư thừa] Phần "${group}" không có trong cấu hình mặc định. Đang xoá bỏ.`);
            delete iniObject[group];
        }
    }

    writeIniFile(generateIniContent(iniObject));
}

// Gọi hàm validateConfigFile với các ngoại lệ
validateConfigFile(iniObject, ["fileGGDriveId", "emailGGDrive", "syncDate"]);


// Hàm lấy ra giá trị của tệp
function getValueSetting(name, group) {
    var iniObj = parseIni(fs.readFileSync(iniFilePath, 'utf8'));
    return iniObj[group]?.[name];
}



module.exports = {
    updateSetting,
    initSetting,
    dbPath: parseIni(fs.readFileSync(iniFilePath, 'utf8')).Data.dbPath,
    iniFilePath,
    parseIni,
    getValueSetting,
}
