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

// Hàm định dạng số thành định dạng tiền tệ
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}