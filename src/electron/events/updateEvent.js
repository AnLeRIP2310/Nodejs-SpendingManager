const autoUpdater = require('electron-updater').autoUpdater;
const { app, ipcMain, dialog } = require('electron');
const appIniConfigs = require('../../configs/appIniConfigs');
const axios = require('axios');
const logger = require('../../configs/logger');
const packageObj = require('../../../package.json');
const windowManager = require('../windowManager');
const prettyBytes = require('pretty-bytes');



// Khai báo trạng thái đóng gói của ứng dụng (Chỉ sử dụng khi kiểm tra autoUpdater trong môi trường dev)
// Object.defineProperty(app, 'isPackaged', {
//     get() {
//         return true;
//     }
// });

// Cấu hình autoUpdater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;


// Hàm tự động cập nhật
function checkUpdateSettings() {
    const autoUpdate = appIniConfigs.getIniConfigs('autoUpdate');

    if (autoUpdate) {
        setTimeout(() => {
            autoUpdater.checkForUpdates();
        }, 5000);
    }
}

// Hàm để lấy thông tin release từ GitHub
async function getGitHubReleaseInfo(owner, repo) {
    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
        return response.data;
    } catch (error) {
        logger.error(error.message, 'Lỗi khi lấy thông tin ghi chú phát hành của github')
        return null;
    }
}

// Bắt sự kiện autoUpdater từ client
ipcMain.on('check-for-update', () => {
    autoUpdater.checkForUpdates();
})

// Bắt sự kiện có bản cập nhật
autoUpdater.on('update-available', async () => {
    try {
        const gitUrl = packageObj.repository.url
        var releaseNote, owner, repo;

        // Sử dụng biểu thức chính quy để tìm owner và repo
        const match = gitUrl.match(/github\.com\/([^/]+)\/([^/]+)\.git/i);

        if (match) {
            owner = match[1]; repo = match[2];

            // Lấy thông tin về bản cập nhật
            const githubReleaseInfo = await getGitHubReleaseInfo(owner, repo);
            if (githubReleaseInfo) {
                releaseNote = githubReleaseInfo.body || 'Không có ghi chú phát hành về bản cập nhật';
            }
        }

        // Lấy ra cấu hình về việc có được hiển thị thông báo không
        const downloadPrompt = appIniConfigs.getIniConfigs('downloadPrompt')

        // Gửi về client renderer
        const mainWindow = windowManager.getMainWindow();
        mainWindow.webContents.send('update-available', { downloadPrompt, releaseNote });
    } catch (e) {
        logger.error(e)
    }
});

// Bắt sự kiện cho phép tải về bản cập nhật
ipcMain.on('allow-download-update', () => {
    autoUpdater.downloadUpdate();
})

// Bắt sự kiện không có bản cập nhật
autoUpdater.on('update-not-available', () => {
    // Gửi về client renderer
    const mainWindow = windowManager.getMainWindow();
    mainWindow.webContents.send('update-not-available');
});

// Bắt sự kiện có lỗi khi cập nhật
autoUpdater.on('error', (err) => {
    // Gửi về client renderer
    const mainWindow = windowManager.getMainWindow();
    mainWindow.webContents.send('update-error', err);
    logger.error('Có lỗi khi câp nhật:', err);
});

// Bắt sự kiện tiến trình tải về
autoUpdater.on('download-progress', (progressObj) => {
    progressObj.bytesPerSecond = prettyBytes(progressObj.bytesPerSecond);
    progressObj.total = prettyBytes(progressObj.total);
    progressObj.transferred = prettyBytes(progressObj.transferred);
    progressObj.percent = Math.floor(progressObj.percent);

    // Gửi về client renderer
    const mainWindow = windowManager.getMainWindow();
    mainWindow.webContents.send('download-progress', progressObj);
});

// Bắt sự kiện sau khi tải hoàn tất
autoUpdater.on('update-downloaded', () => {
    // Gửi về client renderer
    const mainWindow = windowManager.getMainWindow();
    mainWindow.webContents.send('update-downloaded');

    // Hiển thị thông báo khi bản cập nhật đã được tải về
    dialog.showMessageBox({
        type: 'info',
        message: 'Bản cập nhật đã được tải về. Ứng dụng sẽ khởi động lại để cài đặt cập nhật.',
        buttons: ['OK'],
    }).then((response) => {
        if (response.response === 0) {
            windowManager.setIsQuitting(true);
            autoUpdater.quitAndInstall();
        }
    });
});


const updateEvent = { checkUpdateSettings }

module.exports = updateEvent;