const fs = require('fs');
const path = require('path');

function errorLogs(error, message) {
    message = ''; message = message || 'Ứng dụng gặp lỗi sau';
    console.log(message, ':', error);

    const logDir = path.join(process.env.USERPROFILE, 'documents', 'SpendingManager', 'logs');
    const timestamp = new Date().toISOString().replace(/[-T:.]/g, '_');
    const logFileName = `error_log-${timestamp}.txt`;
    const logPath = path.join(logDir, logFileName);

    // Kiểm tra xem thư mục log có tồn tại chưa
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = `${error.stack || error}\n`;

    fs.appendFileSync(logPath, logEntry, 'utf-8');

    console.log('đã ghi nhật kí lỗi');
}

module.exports = errorLogs;