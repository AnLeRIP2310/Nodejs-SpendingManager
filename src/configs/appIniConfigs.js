const path = require('path');
const fs = require('fs');
const ini = require('ini');



// Tạo biến lưu cấu hình mặt định của tệp ini
const defaultConfigs = {
    Data: {
        dbPath: ['default'],
        driveFileId: [''],
        driveEmail: [''],
        backupDate: [''],
    },
    App: {
        version: [''],
        darkMode: ['light', 'dark', 'auto'],
        windowPositionX: ['0.65', '0.5', '0.35'], // 0.65: căn phải - 0.35: căn trái - 0.5: căn giữa
        windowPositionY: ['1', '0.8', '1.2'], //0.8: căn trên - 1: căn giữa - 1.2: căn dưới
        defaultPage: ['home', 'spending', 'statics', 'noted'],
        defaultAction: ['add', 'del', 'edit'],
        language: ['vi', 'en'],
        reminderDelete: [true, false],
        tooltip: [true, false],
        closeDefault: ['ask', 'quit', 'tray'],
        notifySpend: [true, false],
        startWithWindow: [false, true],
        autoUpdate: [false, true],
        downloadPrompt: [true, false],
        autoAdd000: [true, false],
        allowCalc: [true, false],
    }
};


var folderAppConfigs; // Biến lưu thư mục cấu hình
if (process.platform === 'win32')
    folderAppConfigs = path.join(process.env.USERPROFILE, 'Documents', 'SpendingManager');
else if (process.platform === 'darwin')
    folderAppConfigs = path.join(process.env.HOME, 'Documents', 'SpendingManager');

// Tạo thư mục cấu hình nếu nó chưa tồn tại
if (!fs.existsSync(folderAppConfigs)) {
    fs.mkdirSync(folderAppConfigs, { recursive: true });
}

// Tạo biến lưu đường dẫn đến tệp cấu hình ini
const iniFilePath = path.join(folderAppConfigs, 'appConfigs.ini');


/**
 * @returns {string} Đường dẫn lưu thư mục cấu hình của ứng dụng
 * 
 * @example
 * - Lấy ra đường dẫn đến thư mục cấu hình
 * getfolderAppConfigs();
 */
function getfolderAppConfigs() {
    return folderAppConfigs;
}


/**
 * @param {string} [group] - Tên nhóm của cài đặt.
 * @param {string} [name] - Tên của cài đặt.
 * @param {string} [value] - Giá trị của cài đặt.
 *
 * @example
 * - Tạo một tệp cấu hình mới hoặc tạo lại tệp cấu hình
 * createIniConfigs();
 * 
 * - Thêm một cài đặt mới vào nhóm 'Data' với tên 'dbPath' và giá trị 'default'
 * createIniConfigs('Data', 'dbPath', 'default');
 */
function createIniConfigs(group, name, value) {
    const iniData = fs.existsSync(iniFilePath) ? ini.parse(fs.readFileSync(iniFilePath, 'utf-8')) : {};

    if (name !== undefined && value !== undefined && group !== undefined) {
        // Kiểm tra xem group có tồn tại không
        if (!iniData[group]) {
            iniData[group] = {};
        }

        // Kiểm tra xem name đã tồn tại trong group chưa
        if (iniData[group][name] === undefined) {
            // Thêm cài đặt mới vào group
            iniData[group][name] = value;
            console.log(`Tệp cấu hình được cập nhật với cài đặt mới: ${name}=${value} trong nhóm ${group}`);
        } else {
            console.error(`Tên cài đặt '${name}' đã tồn tại trong nhóm '${group}'.`);
            return;
        }
    } else {
        for (const section in defaultConfigs) {
            iniData[section] = {};

            for (const key in defaultConfigs[section]) {
                iniData[section][key] = defaultConfigs[section][key][0];
            }
        }

        console.log(`Tệp cấu hình đã được tạo tại: ${iniFilePath}`);
    }

    // Chuyển đối tượng thành chuỗi ini
    const iniString = ini.stringify(iniData);
    fs.writeFileSync(iniFilePath, iniString, 'utf-8');
}


/**
 * @param {string} [group] - Tên nhóm của cài đặt.
 * @param {string} [name] - Tên của cài đặt.
 * @param {string} [value] - Giá trị của cài đặt.
 * 
 * @example
 * - Cập nhật một cài đặt trong tệp cấu hình .ini
 * updateIniConfigs('Data', 'dbPath', 'default');
 */
function updateIniConfigs(group, name, value) {
    const iniData = ini.parse(fs.readFileSync(iniFilePath, 'utf-8'));

    // Kiểm tra xem group có tồn tại không
    if (iniData[group]) {
        // Kiểm tra xem name có tồn tại trong group không
        if (iniData[group][name] !== undefined) {
            // Chỉnh sửa giá trị của name trong group
            iniData[group][name] = value;

            // Chuyển đổi đối tượng thành chuỗi ini
            const iniString = ini.stringify(iniData);

            // Ghi chuỗi ini vào tệp cấu hình ini
            fs.writeFileSync(iniFilePath, iniString, 'utf-8');
            console.log(`Cấu hình đã được cập nhật: ${name}=${value}`);
        } else {
            console.error(`Tên cài đăt '${name}' không tồn tại trong nhóm '${group}'.`);
        }
    } else {
        console.error(`Nhóm '${group}' không tồn tại.`);
    }
}


/**
 * @param {string} [group] - Tên nhóm của cài đặt.
 * @param {string} [name] - Tên cài đặt.
 * 
 * @example
 * - Xoá một cài đặt trong tệp cấu hình .ini
 * deleteIniConfigs('Data', 'dbPath');
 * 
 * - Xoá tất cả cài đặt trong một nhóm của tệp cấu hình ini
 * deleteIniConfigs('Data');
 */
function deleteIniConfigs(group, name) {
    const iniData = ini.parse(fs.readFileSync(iniFilePath, 'utf-8'));

    // Nếu chỉ có tham số group, xóa group và tất cả cài đặt trong group đó
    if (group !== undefined && name === undefined) {
        if (iniData[group]) {
            delete iniData[group];
            const iniString = ini.stringify(iniData);
            fs.writeFileSync(iniFilePath, iniString, 'utf-8');
            console.log(`Tập tin cấu hình được cập nhật, đã xóa nhóm '${group}' và tất cả cài đặt trong nhóm đó.`);
        } else {
            console.error(`Nhóm '${group}' không tồn tại.`);
        }
        return;
    }

    // Nếu có cả tham số group và name, xóa chỉ cài đặt name trong group đó
    if (group !== undefined && name !== undefined) {
        if (iniData[group]) {
            if (iniData[group][name] !== undefined) {
                delete iniData[group][name];
                // Nếu group trở thành trống sau khi xoá cài đặt, xoá luôn group
                if (Object.keys(iniData[group]).length === 0) {
                    delete iniData[group];
                }
                const iniString = ini.stringify(iniData);
                fs.writeFileSync(iniFilePath, iniString, 'utf-8');
                console.log(`Tập tin cấu hình được cập nhật, đã xóa cài đặt: ${name}`);
            } else {
                console.error(`Tên cài đặt '${name}' không tìm thấy trong nhóm '${group}'.`);
            }
        } else {
            console.error(`Nhóm '${group}' không tồn tại.`);
        }
        return;
    }

    console.error('Thiếu tham số cần xóa (group hoặc cả group và name).');
}


/**
 * @param {string} [name] - Tên cài đặt.
 * @param {string} [group] - Tên nhóm của cài đặt.
 * 
 * @example
 * - Lấy tất cả giá trị trong tệp ini
 * getIniConfigs(); // hàm sẽ trả về một object
 * 
 * - Lấy ra một giá trị trong tệp ini
 * getIniConfigs('dbPath');
 * 
 * - Nếu muốn lấy ra chính xác giá trị thì có thể truyền vào tham số group
 * getIniConfigs('dbPath', 'Data');
 */
function getIniConfigs(name, group) {
    const iniData = ini.parse(fs.readFileSync(iniFilePath, 'utf-8'));

    // Nếu chỉ có tham số name, trả về giá trị đầu tiên tìm thấy mà không cần group
    if (name && !group) {
        for (const existingGroup in iniData) {
            if (iniData[existingGroup][name] !== undefined) {
                return iniData[existingGroup][name];
            }
        }
        console.error(`Tên cài đặt '${name}' không tìm thấy trong bất kỳ nhóm nào.`);
        return null;
    }

    // Nếu cả hai tham số đều được truyền vào
    if (name && group) {
        // Kiểm tra xem group có tồn tại không
        if (iniData[group]) {
            // Kiểm tra xem name có tồn tại trong group không
            if (iniData[group][name] !== undefined) {
                // Trả về giá trị của name trong group
                return iniData[group][name];
            } else {
                console.error(`Tên cài đặt '${name}' không tìm thấy trong nhóm '${group}'.`);
                return null;
            }
        } else {
            console.error(`Nhóm '${group}' không tồn tại.`);
            return null;
        }
    }

    // Nếu không có tham số nào được truyền vào, trả về toàn bộ nội dung tệp ini
    return JSON.parse(JSON.stringify(iniData));
}

// Hàm kiểm tra giá trị và sửa nếu có lỗi
function validateConfigs(exceptions = []) {
    const iniData = JSON.parse(JSON.stringify(ini.parse(fs.readFileSync(iniFilePath, 'utf-8'))));
    const isExempt = (name) => exceptions.includes(name);

    // Lặp qua từng group trong defaulconfigs
    for (const group in defaultConfigs) {
        // Lặp qua từng name trong nhóm của defaulconfigs
        for (const name in defaultConfigs[group]) {
            // Kiểm tra mảng ngoại lệ
            if (isExempt(name)) {
                // console.log(`[Ngoại lệ] Cài đặt ${group}.${name} được bỏ qua kiểm tra giá trị`);

                // Kiểm tra và tạo lại cài đặt nếu bị xoá
                if (!iniData[group]?.hasOwnProperty(name)) {
                    console.log(`[Thiếu] Cài đặt ${group}.${name} bị thiếu. Tạo lại cài đặt.`);
                    createIniConfigs(group, name, '');
                }
                continue;
            }

            const value = iniData[group]?.[name];
            const validOptions = defaultConfigs[group][name];

            if (value === undefined) {
                console.log(`[Thiếu] Giá trị của ${group}.${name} bị thiếu. Đặt lại mặt định: ${validOptions[0]}`);
                createIniConfigs(group, name, validOptions[0]);
            } else if (validOptions?.includes(value)) {
                continue;
            } else if (!defaultConfigs[group]?.[name]) {
                console.log(`[Dư thừa] Giá trị của ${group}.${name} không tồn tại trong defaultConfigs. Xoá giá trị này.`);
                delete iniData[group][name];
            } else {
                console.log(`[Không hợp lệ] Giá trị của ${group}.${name} là không hợp lệ. Đặt lại mặt định: ${validOptions[0]}`);
                updateIniConfigs(group, name, validOptions[0]);
            }
        }

        // Loại bỏ các cài đặt không thuộc defaultConfigs
        for (const existingName in iniData[group]) {
            if (!(existingName in defaultConfigs[group])) {
                console.log(`[Dư thừa] Cài đặt ${group}.${existingName} không tồn tại trong defaultConfigs. Xoá giá trị này.`);
                deleteIniConfigs(group, existingName);
            }
        }
    }

    // lặp qua từng group trong tệp ini
    for (const group in iniData) {
        // Nếu group không tồn tại trong defaulconfig thì xoá nó
        if (!defaultConfigs[group]) {
            console.log(`[Dư thừa] Nhóm "${group}" không có trong cấu hình mặc định. Đang xoá bỏ.`);
            deleteIniConfigs(group);
        }
    }
}


// Nếu tệp cấu hình .ini chưa tồn tại thì tạo mới
if (!fs.existsSync(iniFilePath)) {
    // Gọi hàm để tạo tệp .ini
    createIniConfigs();
}

// Gọi hàm để kiểm tra tệp .ini
const excep = ['driveFileId', 'driveEmail', 'backupDate', 'version', 'dbPath']
validateConfigs(excep);

// Kiểm tra giá trị của biến dbPath tránh trường hợp giá trị bị rỗng
if (getIniConfigs('dbPath') == '') { updateIniConfigs('Data', 'dbPath', 'default'); }


// Tạo một đối tượng để xuất
const appIniConfigs = {
    getfolderAppConfigs,
    createIniConfigs,
    updateIniConfigs,
    deleteIniConfigs,
    getIniConfigs
}



module.exports = appIniConfigs