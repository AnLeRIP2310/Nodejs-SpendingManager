const { google } = require('googleapis');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const errorLogs = require('./errorLogs');
const appIniConfigs = require('./appIniConfigs');



// Khai báo các đường dẫn mặt định
var folderAppConfigs = appIniConfigs.getfolderAppConfigs();
const pathToJsonToken = path.join(folderAppConfigs, 'data', 'Token.json');
var defaultPathSave;

if (process.platform === 'win32') {
    defaultPathSave = path.join(process.env.USERPROFILE, 'Downloads');
} else if (process.platform === 'darwin') {
    defaultPathSave = path.join(process.env.HOME, 'Downloads');
}




// Hàm giải mã refreshToken
function decryptRefreshToken(pathToJsonFile) {
    const algorithm = 'aes-256-cbc';
    const key = process.env.KEY_ENCRYPT_REFRESH_TOKEN;

    // Đọc nội dung tệp Json đồng bộ
    try {
        const data = fs.readFileSync(pathToJsonFile);
        const tokenData = JSON.parse(data);
        const { encryptedToken, iv } = tokenData.encryptedToken;

        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
        let decryptedToken = decipher.update(encryptedToken, 'hex', 'utf8');
        decryptedToken += decipher.final('utf8');

        return decryptedToken;
    } catch (err) {
        errorLogs(err, 'Lỗi khi đọc tệp JSON');
        return null;
    }
}


var drive;



module.exports = {
    setAuthen: (clientId, clientSecret, refreshToken) => {
        try {
            // Tạo đối tượng OAuth2Client
            const oauth2Client = new google.auth.OAuth2(
                process.env.GG_DRIVE_CLIENT_ID || clientId,
                process.env.GG_DRIVE_CLIENT_SECRET || clientSecret
            );

            // Kiểm tra xem tệp token có tồn tại không
            if (fs.existsSync(pathToJsonToken)) {
                // Thiết lập thông tin xác thực
                oauth2Client.setCredentials({
                    refresh_token: decryptRefreshToken(pathToJsonToken) || refreshToken,
                });

                // Tạo phiên làm việc với đối tượng OAuth2Client
                drive = google.drive({ version: 'v3', auth: oauth2Client });
            } else {
                drive = 'Chưa được khởi tạo tham số';
            }
        } catch (e) {
            errorLogs(e)
        }
    },

    uploadFile: async (nameFile, content, mimeType) => {
        try {
            // Kiểm tra biến drive trước khi thực hiện chức năng
            if (typeof drive === 'string') {
                return { success: false, message: 'Chưa thiết lập quyền truy cập, gọi hàm setAuthen() và thiết lập để khởi tạo!' };
            }

            let isFilePath = false;
            let response;

            // Kiểm tra xem content có phải là đường dẫn không
            if (typeof content === 'string') {
                // kiểm tra xem có phải là đường dẫn tuyệt đối không
                isFilePath = path.isAbsolute(content);
            }

            if (mimeType) {
                response = await drive.files.create({
                    requestBody: {
                        name: nameFile,
                        parents: ['appDataFolder'],
                    },
                    media: {
                        mimeType: mimeType,
                        body: isFilePath ? fs.readFileSync(content, 'utf8') : content,
                    }
                })
            } else {
                response = await drive.files.create({
                    requestBody: {
                        name: nameFile,
                        parents: ['appDataFolder'],
                    },
                    media: {
                        body: isFilePath ? fs.readFileSync(content, 'utf8') : content,
                    }
                })
            }

            if (response.status == 200) {
                return { success: true, message: 'Tải lên thành công', data: response.data };
            } else {
                return { success: false, message: `Lỗi HTTP: ${response.status}` };
            }
        } catch (e) {
            errorLogs(e, 'Lỗi khi tải lên tệp JSON')
            return { success: false, message: 'Lỗi khi thực hiện yêu cầu' };
        }
    },

    downloadFile: async (fileId, pathSave) => {
        try {
            // Kiểm tra biến drive trước khi thực hiện chức năng
            if (typeof drive === 'string') {
                return { success: false, message: 'Chưa thiết lập quyền truy cập, gọi hàm setAuthen() và thiết lập để khởi tạo!' };
            }

            const response = await drive.files.get({
                fileId: fileId,
                alt: 'media',
            });

            if (response.status === 200) {
                let fileContent;

                // Kiểm tra xem response.data có phải là một đối tượng JSON hay không
                if (typeof response.data === 'object') {
                    fileContent = JSON.stringify(response.data, null, 2);
                } else {
                    fileContent = response.data;
                }

                fs.writeFileSync(pathSave || defaultPathSave, fileContent, 'utf8');
                return { success: true, message: 'Tải về tệp tin thành công', pathSave: pathSave || defaultPathSave };
            } else if (response.status === 404) {
                return { success: false, message: `Không tìm thấy tếp tin với Id: ${fileId}` };
            } else {
                return { success: false, message: `Lỗi HTTP: ${response.status}` };
            }
        } catch (e) {
            errorLogs(e, 'Lỗi khi tải về tệp JSON')
            return { success: false, message: 'Lỗi khi thực hiện yêu cầu' };
        }
    },

    deleteFile: async (fileId) => {
        try {
            // Kiểm tra biến drive trước khi thực hiện chức năng
            if (typeof drive === 'string') {
                return { success: false, message: 'Chưa thiết lập quyền truy cập, gọi hàm setAuthen() và thiết lập để khởi tạo!' };
            }

            const response = await drive.files.delete({
                fileId: fileId
            });

            if (response.status === 204) {
                return { success: true, message: `Xoá tệp tin với Id: ${fileId} thành công` };
            } else if (response.status === 404) {
                return { success: false, message: 'Tệp tin không tồn tại' };
            } else {
                return { success: false, message: `Lỗi HTTP: ${response.status}` };
            }
        } catch (e) {
            errorLogs(e, 'Lỗi khi xóa tệp tin');
            return { success: false, message: 'Xóa tệp tin thất bại' };
        }
    },

    getFileById: async (fileId) => {
        try {
            // Kiểm tra biến drive trước khi thực hiện chức năng
            if (typeof drive === 'string') {
                return { success: false, message: 'Chưa thiết lập quyền truy cập, gọi hàm setAuthen() và thiết lập để khởi tạo!' };
            }

            const response = await drive.files.get({
                fileId: fileId,
                fields: 'id, name, mimeType',
            });

            if (response.status == 200) {
                const file = response.data;
                return { success: true, message: 'Lấy thông tin tệp tin thành công', file: file };
            } else {
                return { success: false, message: `Lỗi yêu cầu HTTP: ${response.status}`, };
            }

        } catch (e) {
            errorLogs(e, 'Lỗi khi lấy thông tin tệp tin');
            return { success: false, message: 'Lỗi khi thực hiện yêu cầu lấy thông tin tệp tin' };
        }
    },

    getListFile: async (appDataFolder = true) => {
        try {
            // Kiểm tra biến drive trước khi thực hiện chức năng
            if (typeof drive === 'string') {
                return { success: false, message: 'Chưa thiết lập quyền truy cập, gọi hàm setAuthen() và thiết lập để khởi tạo!' };
            }

            let response;

            if (appDataFolder == false) {
                response = await drive.files.list({
                    fields: 'files(id, name, mimeType)',
                });
            } else {
                response = await drive.files.list({
                    spaces: 'appDataFolder',
                    fields: 'files(id, name, mimeType)',
                });
            }

            if (response.status == 200) {
                const files = response.data.files;
                return { success: true, message: 'Lấy danh sách tệp tin thành công', files: files };
            } else {
                return { success: false, message: `Lỗi yêu cầu HTTP: ${response.status}`, };
            }
        } catch (e) {
            errorLogs(e, 'Lỗi khi lấy danh sách tệp tin');
            return { success: false, message: 'Lỗi khi thực hiện yêu cầu lấy danh sách tệp tin', };
        }
    },
}


