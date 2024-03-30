// Định dạng lại ngày tháng năm
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function formatDateForInput(dateStr) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${year}-${day}-${month}`;
    }
    return dateStr; // Trả về nguyên bản nếu không thể chuyển đổi
}

// Hàm định dạng thời gian
function formatTime(inputTime) {
    var hours = inputTime.getHours();
    var minutes = inputTime.getMinutes();
    var seconds = inputTime.getSeconds();
    var meridiem = "SA";

    // Chuyển đổi sang định dạng 12 giờ
    if (hours > 12) { hours -= 12; meridiem = "CH"; }

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    var timeString = hours + ":" + minutes + ":" + seconds + " " + meridiem;
    return timeString;
}

function formatDateTime(value) {
    const date = new Date(value);
    const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true };
    const timeString = date.toLocaleTimeString('vi-VN', options);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year} - ${timeString}`;
}

// Hàm định dạng số thành định dạng tiền tệ
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

// Hàm định dạng số phần trăm
function formatPercent(value) { return value.toFixed(2) + '%' }

// Đăng ký helper để chuyển đổi biến handlebars từ %variable% thành {{variable}}
function convertPlaceHbs(template, options = { from: { start: "%", end: "%" }, to: { start: "{{", end: "}}" } }) {
    const { from, to } = options;
    const startRegex = new RegExp(from.start.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '([^]*?)' + from.end.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
    // Tìm các cặp mở và đóng trong template

    return template.replace(startRegex, function (match, p1) {
        // Thực hiện thay thế trong từng cặp
        return to.start + p1.replace(new RegExp(to.start.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), from.start)
            .replace(new RegExp(to.end.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), from.end) + to.end;
    });
}

// Đăng ký helper thêm hàm cho handlebars
Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
});
// Thêm class dựa trên giá trị % trong handlebars
Handlebars.registerHelper('addPercentageClass', function (value) {
    if (parseFloat(value) > 0) {
        return new Handlebars.SafeString('text-success');
    } else if (parseFloat(value) < 0) {
        return new Handlebars.SafeString('text-danger');
    } else {
        return '';
    }
});

function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
}
function getCookie(name) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return cookieValue ? cookieValue.pop() : '';
}
function setCookie(name, value, days) {
    const expiration = new Date();
    expiration.setTime(expiration.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + expiration.toUTCString();
    document.cookie = name + "=" + value + "; " + expires + "; path=/";
}