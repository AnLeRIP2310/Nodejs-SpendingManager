const crypto = require('crypto');
const logger = require('./logger');
const fs = require("fs");
const { Readable } = require('stream');



const myUtils = {
    // Hàm định dạng lại thời gian theo dd/mm/yyyy
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },

    // Hàm định dạng lại thời gian từ dd/mm/yyyy thành yyyy-mm-dd để dùng trong các thẻ input
    formatDateForInput(dateStr) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
            const [month, day, year] = parts;
            return `${year}-${day}-${month}`;
        }
        return dateStr; // Trả về nguyên bản nếu không thể chuyển đổi
    },

    // Hàm định dạng thời gian theo kiểu dd/mm/yyyy - hh:mm:ss
    formatDateTime(value) {
        const date = new Date(value);
        const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true };
        const timeString = date.toLocaleTimeString('vi-VN', options);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year} - ${timeString}`;
    },

    // Hàm định dạng giá trị số thành giá trị tiền tệ
    formatCurrency(value) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    },

    // Hàm mã hoá refreshToken của GGDrive
    encryptRefreshToken(refreshToken) {
        const algorithm = 'aes-256-cbc';
        const key = process.env.KEY_ENCRYPT_REFRESH_TOKEN;
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encryptedToken = cipher.update(refreshToken, 'utf8', 'hex');
        encryptedToken += cipher.final('hex');

        return {
            iv: iv.toString('hex'),
            encryptedToken,
        };
    },

    // Hàm giải mã refreshToken của GGDrive
    decryptRefreshToken(encryptedToken, iv) {
        const algorithm = 'aes-256-cbc';
        const key = process.env.KEY_ENCRYPT_REFRESH_TOKEN;

        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
        let decryptedToken = decipher.update(encryptedToken, 'hex', 'utf8');
        decryptedToken += decipher.final('utf8');

        return decryptedToken;
    },

    // Hàm giải mã refreshToken với đường dẫn đến tệp Json
    decryptRefreshTokenByPath(pathToJsonFile) {
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
            logger.error(err, 'Lỗi khi đọc tệp JSON');
            return null;
        }
    },

    // Hàm để tạo một stream từ buffer
    bufferToStream: (buffer) => {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        return stream;
    },

    // Hàm để chuyển đổi stream thành buffer
    streamToBuffer: async (stream) => {
        const chunks = [];
        for await (let chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    },

    // Hàm mã hoá dữ liệu
    encrypt(text) {
        const algorithm = 'aes-256-cbc';
        const key = process.env.KEY_ENCRYPT_DATA;
        const iv = crypto.randomBytes(16);

        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Thêm tiền tố để nhận diện đây là dữ liệu mã hóa
        return `ENC:${iv.toString('hex')}:${encrypted}`;
    },

    // Hàm giải mã dữ liệu
    decrypt(encrypted) {
        const algorithm = 'aes-256-cbc';
        const key = process.env.KEY_ENCRYPT_DATA;

        // Kiểm tra nếu dữ liệu có tiền tố 'ENC:' thì mới giải mã
        if (!encrypted.startsWith('ENC:')) return encrypted;

        // Tách IV và chuỗi mã hóa
        const parts = encrypted.split(':');
        const iv = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
};

module.exports = myUtils;