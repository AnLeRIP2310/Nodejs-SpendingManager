const fs = require('fs');
const path = require('path');
const appIniConfigs = require('./appIniConfigs');



const logDir = path.join(appIniConfigs.getfolderAppConfigs(), 'logs')

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logger = {
    /**
     * Ghi các thông tin lỗi vào tệp nhật ký
     *
     * @param {Error} error - Truyền vào thông tin lỗi
     * @param {string} message - Truyền thông báo cho lỗi nếu cần 
     * 
     * @example
     * 
     * // Gọi hàm và truyền biến vào
     * logger.error(error);
     * 
     * // Có thể truyền thêm thông báo cho lỗi nếu cần
     * logger.error(error, 'Lỗi khi gọi hàm');
     */
    error(error, message = 'Ứng dụng gặp lỗi sau') {
        console.log(message + ':', error);

        const timestamp = new Date().toISOString().replace(/[-T:.]/g, '-');
        const logFileName = `error_log-${timestamp}.txt`;
        const logPath = path.join(logDir, logFileName);

        try {
            const logEntry = `${error.stack || error}\n`;
            fs.appendFileSync(logPath, logEntry, 'utf-8');
            // console.log('Đã ghi nhật kí thành công');
        } catch (e) {
            console.log('Ghi nhật kí thất bại:', e);
        }

    },


    /**
     * Ghi các thông tin ứng dụng vào tệp nhật ký 
     * 
     * @param {...any} messages - Thông điệp cần ghi, có thể truyền vào một obj hoặc array
     * 
     * @example
     * 
     * // Gọi hàm và truyền vào giá trị
     * logger.info('chuỗi', [array], {objcet},...);
     */
    info(...messages) {
        console.log(...messages);
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '-');
        const logFileName = `app_log-${timestamp}.txt`;
        const logPath = path.join(logDir, logFileName);

        try {
            const formattedMessages = messages.map((msg) => {
                if (Array.isArray(msg) || typeof msg === 'object') {
                    return JSON.stringify(msg, null, 2);
                } else {
                    return String(msg);
                }
            });

            const logMessage = formattedMessages.join('\n');

            fs.appendFileSync(logPath, `${logMessage}\n`, 'utf-8');
            // console.log('Đã ghi nhật kí thành công');
        } catch (e) {
            console.log('Ghi nhật kí thất bại:', e);
        }
    }
}

module.exports = logger;
