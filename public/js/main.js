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

// Đăng ký helper để chuyển đổi biến handlebars từ %variable% thành {{variable}}
function convertPlaceHbs(template) {
    // Thay thế biểu thức %variable%
    template = template.replace(/%([a-zA-Z0-9.]+)%/g, "{{$1}}");
    // Thay thế biểu thức %#each%
    template = template.replace(/%#each ([a-zA-Z0-9.]+)%/g, "{{#each $1}}");
    template = template.replace(/%\/each%/g, "{{/each}}");
    // Thay thế biểu thức %if%
    template = template.replace(/%#if ([a-zA-Z0-9.]+)%/g, "{{#if $1}}");
    template = template.replace(/%#else%/g, "{{else}}");
    template = template.replace(/%\/if%/g, "{{/if}}");
    // Thay thế biểu thức %unless%
    template = template.replace(/%#unless ([a-zA-Z0-9.]+)%/g, "{{#unless $1}}");
    template = template.replace(/%\/unless%/g, "{{/unless}}");
    // Thay thế biểu thức %#each-in%
    template = template.replace(/%#each-in ([a-zA-Z0-9.]+)%/g, "{{#each-in $1}}");
    template = template.replace(/%\/each-in%/g, "{{/each-in}}");
    // Thay thế biểu thức %with%
    template = template.replace(/%with ([a-zA-Z0-9.]+)%/g, "{{#with $1}}");
    template = template.replace(/%\/with%/g, "{{/with}}");
    // Thay thế biểu thức %lookup%
    template = template.replace(/%lookup ([a-zA-Z0-9.]+) in ([a-zA-Z0-9.]+)%/g, "{{lookup $2 $1}}");
    // Thay thế biểu thức %log%
    template = template.replace(/%log ([a-zA-Z0-9.]+)%/g, "{{log $1}}");
    return template;
}

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