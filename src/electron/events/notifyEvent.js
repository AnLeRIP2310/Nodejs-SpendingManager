const notifier = require('node-notifier');
const windowManager = require('../windowManager');
const schedule = require('node-schedule');
const axios = require('axios');


// Hàm gửi thông báo
function sendNotification() {
    notifier.notify({
        title: 'Nhắc nhở chi tiêu',
        message: 'Hôm nay bạn có khoản chi nào không?, nếu có thì nhớ ghi vào nhé:D',
        icon: path.join(__dirname, '../public/images/favicon.ico'),
        wait: true,
    });
}

// Sự kiện click trên thông báo
notifier.on('click', function (notifierObject, options, event) {
    const mainWindow = windowManager.getMainWindow();
    mainWindow.isVisible() || mainWindow.show();
});

// Hàm kiểm tra dữ liệu trước khi thông báo
function checkForNewData() {
    setTimeout(() => {
        axios.get('http://localhost:3962/setting/checkLastEntry')
            .then(res => {
                // Không có dữ liệu mới, gửi thông báo
                if (res.data.result == 0) {
                    // Kiểm tra cài đặt xem có được gửi thông báo không
                    const notifySpend = appIniConfigs.getIniConfigs('notifySpend');
                    if (notifySpend == true || notifySpend == 'true') { sendNotification() }
                }
            })
            .catch(error => {
                logger.error(error, 'Lỗi khi gửi yêu cầu');
            });
    }, 1000);
}

// Hàm lên lịch hẹn ngẫu nhiên một lần trong khoảng thời gian từ 8h sáng đến 8h tối
function scheduleRandomNotifications() {
    // Lịch hẹn thứ nhất
    const firstRandomHour = Math.floor(Math.random() * 13) + 8; // Ngẫu nhiên từ 8h đến 20h
    const firstRandomMinute = Math.floor(Math.random() * 60); // Ngẫu nhiên từ 0 đến 59

    const firstScheduleRule = new schedule.RecurrenceRule();
    firstScheduleRule.hour = firstRandomHour;
    firstScheduleRule.minute = firstRandomMinute;

    schedule.scheduleJob(firstScheduleRule, () => {
        // Kiểm tra xem có dữ liệu mới trong ngày không
        checkForNewData();
    });

    // Lịch hẹn thứ hai
    const secondRandomHour = Math.floor(Math.random() * 13) + 8; // Ngẫu nhiên từ 8h đến 20h
    const secondRandomMinute = Math.floor(Math.random() * 60); // Ngẫu nhiên từ 0 đến 59

    const secondScheduleRule = new schedule.RecurrenceRule();
    secondScheduleRule.hour = secondRandomHour;
    secondScheduleRule.minute = secondRandomMinute;

    schedule.scheduleJob(secondScheduleRule, () => {
        // Kiểm tra xem có dữ liệu mới trong ngày không
        checkForNewData();
    });
}

const notifyEvent = { scheduleRandomNotifications }

module.exports = notifyEvent;

