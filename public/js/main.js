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

// Hàm lấy thời gian địa phương
function getDatetimeLocal() {
    var dateTimeString = new Date().toLocaleString();
    // Tách ngày, tháng, năm và giờ, phút từ chuỗi
    var [timeString, dateString] = dateTimeString.split(' ');
    var [hour, minute] = timeString.split(':');
    var [day, month, year] = dateString.split('/').map(item => parseInt(item, 10));
    return `${year}-${month < 10 ? '0' + month : month}-${day}T${hour}:${minute}`;
}

// Hàm định dạng ngày giờ và thời gian
function formatDateAndTime(datetimeStr) {
    const date = new Date(datetimeStr);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
}

// Hàm định dạng số thành định dạng tiền tệ
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

// Hàm định dạng tiền cho thẻ input
function inputCurrency(element) {
    var value = element.value.replace(/[^0-9]/g, '');
    let Currency = parseInt(value, 10);
    if (isNaN(Currency)) { element.value = '' }
    else { element.value = Currency.toLocaleString('vi-VN') }
}

// Hàm định dạng số phần trăm
function formatPercent(value) { return value.toFixed(2) + '%' }

// Hàm chuyển đổi biến handlebars từ %variable% thành {{variable}}
function convertPlaceHbs(template, options = { from: { start: "%", end: "%" }, to: { start: "{{", end: "}}" } }) {
    try {
        const { from, to } = options;
        const startRegex = new RegExp(from.start.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '([^]*?)' + from.end.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
        // Tìm các cặp mở và đóng trong template

        return template.replace(startRegex, function (match, p1) {
            // Thực hiện thay thế trong từng cặp
            return to.start + p1.replace(new RegExp(to.start.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), from.start)
                .replace(new RegExp(to.end.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), from.end) + to.end;
        });
    } catch (e) {
        // console.log(e);
    }
}

// Thêm hàm format văn bản thường cho handlebars
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
Handlebars.registerHelper('addClassForPercent', function (value) {
    if (parseFloat(value) > 0) {
        return new Handlebars.SafeString('text-danger');
    } else if (parseFloat(value) < 0) {
        return new Handlebars.SafeString('text-success');
    } else {
        return '';
    }
})
Handlebars.registerHelper('formatMonthInput', function (value) {
    return new Date(value).toISOString().slice(0, 7);
});
// Định dạng thời gian thành tháng - năm có văn bản
Handlebars.registerHelper('formatMonth', function (value) {
    if (settingsObj.language == "vi") {
        return new Date(value).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    } else if (settingsObj.language == "en") {
        return new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
});
// Định dạng tiền tệ trong handlebars
Handlebars.registerHelper('formatCurrency', function (value) {
    if (settingsObj.language == "vi") {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    } else if (settingsObj.language == "en") {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
});
// Định dạng phần trăm trong handlebars
Handlebars.registerHelper('formatPercent', function (value) {
    if (value < 0) {
        return `Giảm ${Math.abs(value).toFixed(0) + '%'}`;
    } else if (value > 0) {
        return `Tăng ${Math.abs(value).toFixed(0) + '%'}`;
    } else {
        return Math.abs(value).toFixed(0) + '%'
    }
});

function showHidePassword(classElement) {
    $(`.${classElement}`).each(function () {
        const input = $(this).find('input');
        const button = $(this).find('button');

        button.on('click', function () {
            if (input.attr('type') === 'password') {
                input.attr('type', 'text');
                button.html('<i class="fa-solid fa-eye-slash"></i>');
            } else {
                input.attr('type', 'password');
                button.html('<i class="fa-solid fa-eye"></i>');
            }
        });
    });
}
showHidePassword('input-group-password');