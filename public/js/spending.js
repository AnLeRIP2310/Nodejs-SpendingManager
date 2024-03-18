
//#region Add SpendList

// gọi hàm addSpendingList khi enter
$('#newSpendingList').on('keyup', function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        addSpendingList();
    }
});
$('#btnSaveSpendingList').on('click', function () {
    addSpendingList();
})

// Hàm thêm một danh sách mới
function addSpendingList() {
    const data = {
        token: JSON.parse(localStorage.getItem('AuthToken')).token,
        namelist: $('#newSpendingList').val(),
        atcreate: formatDate(new Date()),
        status: 1
    }

    $.ajax({
        type: 'POST',
        url: urlapi + '/spending/insertSpendList',
        data: data,
        dataType: 'json',
        contentype: 'application/json',
        success: function (data) {
            if (data.success == true) {
                // Thêm danh sách mới vào thẻ select
                var lastOption = $('#SpendingList option:last');
                var lastOptionValue = lastOption.length > 0 ? parseInt(lastOption.val()) + 1 : 1;
                $('#SpendingList').append('<option value="' + lastOptionValue + '">' + $('#newSpendingList').val() + '</option>');
                $('#newSpendingList').val('');
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
}

//#endregion


// Hàm cuộn xuống cuối của table
function scrollTableToBottom() {
    setTimeout(() => { $('#tbContainer').scrollTop($('#tbContainer')[0].scrollHeight); }, 50);
}


//#region Spending Data For Table

var tblOffset_spending = 0; // Vị trí bắt đầu của dữ liệu cần tải
var tbLimit_spending = 15; // Số lượng tin nhắn cần lấy mỗi lần
var lastScrollHeight = 0; // Lưu lại chiều cao trước khi thêm dữ liệu mới

// Hàm hiển thị spending cho spendlist
function displaySpendingItems() {
    const data = {
        IdList: $('#SpendingList').val(),
        tblOffset: tblOffset_spending,
        tbLimit: tbLimit_spending,
        SearchKey: $('#txtSearch').val(),
        SearchDate: $('#txtSearchDate').val(),
        TypeSearchDate: $('#typeDateSearch').val()
    }

    $.ajax({
        type: 'GET',
        url: urlapi + '/spending/getSpendingForSpendList',
        data: data,
        success: function (response) {
            // Đảo ngược thứ tự của mảng response.data
            var SpendingData = response.data.reverse();

            // Chỉnh sửa dữ liệu nhận được
            SpendingData.forEach((item) => {
                // Chuyển định dạng ngày
                item.atcreate = formatDate(item.atcreate);
                item.atupdate = formatDate(item.atupdate);
                // Định dạng giá tiền
                item.price = formatCurrency(item.price);
            });

            var source = $('#template-tbody').html();
            var convertSource = convertPlaceHbs(source);
            var template = Handlebars.compile(convertSource);
            var data = template({ spendItemByList: SpendingData });

            $('#tbody').prepend(data);

            // Cập nhật offset sau mỗi lần tải dữ liệu
            tblOffset_spending += tbLimit_spending;

            // Cuộn đến vị trí mà người dùng đang xem sau khi dữ liệu được cập nhật
            $('#tbContainer').scrollTop($('#tbContainer')[0].scrollHeight - lastScrollHeight);

            handleRowClickEvent(); // Thêm sự kiện click cho các row
            calculateTotalPrice(); //Gọi hàm tính tổng
            spendingSuggest() // Tạo danh sách gợi ý từ
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// Hàm reset giá trị và gọi hàm hiển thị
function resetAndDisplayItems() {
    tblOffset_spending = 0; lastScrollHeight = 0;
    $('#tbody').empty();
    displaySpendingItems();
}
// gọi sự kiện hàm hiển thị
$('#SpendingList').on('change', function () {
    resetAndDisplayItems()
});
// Gọi sự kiện khi có tìm kiếm với debounce
$('#txtSearch').on('input', _.debounce(resetAndDisplayItems, 300));


$('#txtSearch').on('keyup', function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        resetAndDisplayItems()
    }
});
// Gọi sự kiện khi có tuỳ chọn thời gian
$('#txtSearchDate').on('change', function () {
    resetAndDisplayItems()
    setTimeout(() => {
        resetAndDisplayItems()
    }, 100);
});
// Mở tuỳ chọn tìm kiếm theo thời gian
$('#btn-openDateSearch').click(function () {
    if ($('.searchDate').hasClass('searchDate-expanded')) {
        $('.searchDate').removeClass('searchDate-expanded');
        $('.searchDate').addClass('searchDate-collapsed');
    } else {
        $('.searchDate').addClass('searchDate-expanded');
        $('.searchDate').removeClass('searchDate-collapsed');
    }
});
$('.searchDate').click(function (event) {
    // Ngăn chặn sự kiện click lan truyền lên phần tử cha
    event.stopPropagation();
});
$('#typeDateSearch').on('change', function () {
    console.log('đã gọi sk')
    if ($(this).val() == 'date') {
        $('#txtSearchDate').prop('type', 'date');
    } else {
        $('#txtSearchDate').prop('type', 'month');
    }
});
// Tải thêm danh sách khi cuộn table
$('#tbContainer').scroll(function () {
    if ($('#tbContainer').scrollTop() === 0) {
        // Lưu lại chiều cao trước khi thêm dữ liệu mới
        lastScrollHeight = $('#tbContainer')[0].scrollHeight;

        // Gửi yêu cầu để lấy dữ liệu cũ hơn từ máy chủ
        displaySpendingItems();
    }
});

//#endregion


//#region Binding Table For Input Field

// Chức năng hiển thị thông tin khi nhấp vào một hàng
function displayRowInfo(row) {
    // Nhận các giá trị ô từ hàng được nhấp
    var cells = row.cells;
    var id = cells[0].innerText;
    var dateTime = cells[1].innerText;
    var expenseType = cells[2].innerText;
    var amountWithCurrency = cells[3].innerText;
    var additionalInfo = cells[4].innerText;

    // Loại bỏ dấu ₫ từ giá trị
    var amount = parseFloat(amountWithCurrency.replace(/[₫,.]/g, ''));

    $('#spendId').val(id);
    $('#spendName').val(expenseType);
    $('#spendPrice').val(amount);
    $('#spendDate').val(formatDateForInput(dateTime));
    $('#spendDetails').val(additionalInfo);

    // Gọi hàm xử lý hàng khi có sự kiện click
    handleRowClick(row);
}

// Hàm xử lý sự kiện khi click vào một hàng trong bảng
function handleRowClick(row) {
    var expenseType = row.cells[2].innerText;
    // Tính tổng tiền của item được chọn
    calculateItemPrice(expenseType);
}

// Thêm trình xử lý sự kiện nhấp chuột vào mỗi hàng
function handleRowClickEvent() {
    var table = document.querySelector(".table");
    var rows = table.getElementsByTagName("tr");

    for (var i = 1; i < rows.length; i++) {
        rows[i].addEventListener("click", function () {
            displayRowInfo(this);
        });
    }
}

//#endregion


// Hàm tính tổng tiền của danh sách
function calculateTotalPrice() {
    $.ajax({
        type: "GET",
        url: urlapi + "/spending/calculateTotalPrice",
        success: function (res) {
            $('#spendListTotal').text('Tổng Danh Sách: ' + formatCurrency(res.data));
        }
    })
}
// Hàm tính tổng tiền của 1 mục
function calculateItemPrice(SpendName) {
    $.ajax({
        type: "GET",
        url: urlapi + "/spending/calculateItemPrice",
        data: {
            SpendName: SpendName
        },
        success: function (res) {
            $('#spendItemCount').text("SL: " + res.count);
            $('#spendItemTotal').text("Tổng Mục: " + formatCurrency(res.price));
        }
    })
}


//#region Auto Complete

// Hàm lấy danh sách tên các khoản chi
function getListNameSpending(callback) {
    $.ajax({
        type: 'GET',
        url: urlapi + '/spending/getListNameSpending',
        success: function (res) {
            // Gộp các tên trùng lặp thành một mảng duy nhất
            const uniqueExpenseNames = Array.from(new Set(res.data));
            // Gọi hàm callback và truyền dữ liệu về cho nó
            callback(uniqueExpenseNames);
        },
        error: function (err) {
            console.log(err);
        }
    })
}

// hàm gợi ý từ trên thẻ input
function spendingSuggest() {
    // Gọi getListNameSpending và sử dụng dữ liệu trả về trong callback
    getListNameSpending(function (data) {
        $("#spendName").autoComplete({
            minChars: 1,
            source: function (term, suggest) {
                term = term.toLowerCase();
                var suggestions = [];
                for (var i = 0; i < data.length; i++) {
                    if (~data[i].toLowerCase().indexOf(term)) {
                        suggestions.push(data[i]);
                    }
                }
                suggest(suggestions);
            }
        });

        // Lắng nghe sự kiện khi người dùng nhấn Tab
        $("#spendName").on("keydown", function (e) {
            var autocompleteStatus = $(".autocomplete-suggestions").css("display");
            if (e.key === "Tab") {

                if (autocompleteStatus === "block") {
                    var suggestionsList = $(".autocomplete-suggestions");
                    if (suggestionsList.length > 0) {
                        var matchingSuggestion = suggestionsList.find(".autocomplete-suggestion").first();
                        if (matchingSuggestion.length > 0) {
                            matchingSuggestion.click();
                        }
                    }
                } else {
                    return true;
                }
            }
        });
    });
}

//#endregion

function spendViews(element) {
    var id = $(element).closest('tr.pointer').find('th').text()

    $.ajax({
        type: 'GET',
        url: urlapi + '/spending/getSpendViews',
        data: { id },
        success: function (res) {
            if (res.success) {
                const content = $('#modalSpendViews');
                content.modal('show') // Mở modal

                // Gán giá trị
                content.find('.SpendViews_list-title').text(res.data.namelist);
                content.find('.SpendViews_id-value').text(res.data.id);
                content.find('.SpendViews_name-value').text(res.data.nameitem);
                content.find('.SpendViews_price-value').text(formatCurrency(res.data.price));
                content.find('.SpendViews_date-value').text(formatDateTime(res.data.atcreate));
                content.find('.SpendViews_update-value').text(formatDateTime(res.data.atupdate));
                content.find('.SpendViews_info-value').text(res.data.details);
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
}





// Hàm kiểm tra xem có chứa phép toán không
function isOperation(input) {
    // Kiểm tra xem có chứa các toán tử (+, -, *, /) hay không
    return /\+|-|\*|\//.test(input);
}

// Hàm tính toán đơn giản
function calculate() {
    const spendPrice = $('#spendPrice')

    if (isOperation(spendPrice.val())) {
        try {
            const result = eval(spendPrice.val()); // Sử dụng hàm eval() để tính toán phép toán nhập vào
            spendPrice.val(result);
        } catch (error) { }
    }
}


//#region Button Add, Update, Delete, Clear

// nút thêm dữ liệu vào bảng
$('#btnCreate').on('click', function () {
    calculate();

    const data = {
        ListId: $('#SpendingList').val(),
        Name: $('#spendName').val(),
        Price: $('#spendPrice').val() + '000',
        Details: ($('#spendDetails').val() === null || $('#spendDetails').val() === "") ? "Không có thông tin" : $('#spendDetails').val(),
        AtCreate: $('#spendDate').val(),
        AtUpdate: $('#spendDate').val(),
        Status: 1,
    };

    if (data.ListId == null) {
        showWarningToast('Chưa có danh sách nào được chọn');
        return;
    }

    if (data.Name == '') {
        showWarningToast('Vui lòng nhập tên khoản chi');
        return;
    }

    $.ajax({
        type: 'POST',
        url: urlapi + '/spending/insertSpending',
        data: data,
        dataType: 'json',
        contentype: 'application/json',
        success: function (res) {
            if (res.success == true) {
                // Dữ liệu trả về từ server
                const dataRes = res.data[0];
                dataRes.atupdate = formatDate(dataRes.atupdate);

                // Tạo HTML cho hàng mới
                var newRow = `<tr class ="pointer">
                                <th scope="row">${dataRes.id}</th>
                                <td>${dataRes.atupdate}</td>
                                <td>${dataRes.nameitem}</td>
                                <td>${formatCurrency(dataRes.price)}</td>
                                <td>${dataRes.details}</td>
                            </tr>`;
                // Thêm hàng mới vào bảng
                $('#tbdata tbody').append(newRow);

                scrollTableToBottom(); // cuộn xuống cuối
                handleRowClickEvent(); // gắn sự kiện click cho row
                calculateTotalPrice() // Tính tổng tiền trên danh sách
                $('#btnClearData').click() // Xoá dữ liệu trên field
                $('#spendName').focus() // Nhắm vào thẻ input tên
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
});

// nút cập nhật dữ liệu trong bảng
$('#btnUpdate').on('click', function () {
    const data = {
        Id: $('#spendId').val(),
        ListId: $('#SpendingList').val(),
        Name: $('#spendName').val(),
        Price: $('#spendPrice').val(),
        Details: $('#spendDetails').val(),
        AtUpdate: $('#spendDate').val(),
    }

    if (data.Id == null || data.Id == '' || data.Id == undefined) {
        showWarningToast('Vui lòng chọn dữ liệu muốn sửa');
        return;
    }

    $.ajax({
        type: 'POST',
        url: urlapi + '/spending/updateSpending',
        data: data,
        dataType: 'json',
        contentype: 'application/json',
        success: function (res) {
            if (res.success == true) {
                var foundRow;

                $('#tbody tr').each(function () {
                    var row = $(this);
                    var rowId = row.find('th:first').text();

                    if (rowId == data.Id) {
                        foundRow = row;
                        return false; // dừng vòng lặp
                    }
                })

                // Cập nhật lại trên table
                foundRow.find('td').eq(0).text(formatDate(data.AtUpdate));
                foundRow.find('td').eq(1).text(data.Name);
                foundRow.find('td').eq(2).text(formatCurrency(data.Price));
                foundRow.find('td').eq(3).text(data.Details);

                calculateTotalPrice() // Tính tổng tiền trên danh sách
                $('#btnClearData').click() // Xoá dữ liệu trên field
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
})

// nút xoá dữ liệu trong bảng
$('#btnDelete').on('click', function () {
    if ($('#spendId').val() == null || $('#spendId').val() == '') {
        showWarningToast('Vui lòng chọn dữ liệu muốn xoá');
        return;
    }

    if (settingsObj.reminderDelete == true || settingsObj.reminderDelete == 'true') {
        $('#modalConfirmDelete').modal('show');
    } else {
        deleteSpendingItem()
    }
});
// Nút xác nhận xoá dữ liệu trong bảng
$('#btnConfirmDelete').click(function () {
    // Kiểm tra xem có tick vào ô tắt thông báo không
    if ($('#reminderDelete').prop('checked')) {
        settingsObj.reminderDelete = false;
        editSettings('reminderDelete', false, 'App', reminderDelete);
        $('#reminderDelete').prop('checked', false);
    }

    deleteSpendingItem()
    $('#modalConfirmDelete').modal('hide');
})

// hàm xoá dữ liệu trong bảng
function deleteSpendingItem() {
    const data = {
        Id: $('#spendId').val(),
    }

    if (data.Id == null) {
        showWarningToast('Vui lòng chọn dữ liệu muốn xoá');
        return;
    }

    $.ajax({
        type: 'POST',
        url: urlapi + '/spending/deleteSpending',
        data: data,
        dataType: 'json',
        contentype: 'application/json',
        success: function (res) {
            if (res.success == true) {
                var foundRow;

                $('#tbody tr').each(function () {

                    var row = $(this);
                    var rowId = row.find('th:first').text();

                    if (rowId == data.Id) {
                        foundRow = row;
                        return false; // dừng vòng lặp
                    }
                });
                // xoá row khỏi table
                foundRow.remove();

                calculateTotalPrice() // Tính tổng tiền trên danh sách
                $('#btnClearData').click() // Xoá dữ liệu trên field
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
}

// nút clear data
$('#btnClearData').on('click', function () {
    $('#spendId').val('');
    $('#spendDate').val(formatDateForInput(formatDate(new Date())));
    $('#spendName').val('');
    $('#spendPrice').val('');
    $('#spendDetails').val('');
});

// Gọi Sk Thêm/Sửa/Xoá dữ liệu trên input
$('#spendName, #spendPrice, #spendDetails').on('keyup', function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();

        if (settingsObj.defaultAction == 'add') {
            $('#btnCreate').click();
        } else if (settingsObj.defaultAction == 'edit') {
            $('#btnUpdate').click();
        } else if (settingsObj.defaultAction == 'del') {
            $('#btnDelete').click();
        }
    }
});

//#endregion

// Nút Xuất file Excel
$('#btn-excel_export').click(function () {
    const table = document.getElementById('tbdata');
    var wb = XLSX.utils.table_to_book(table)
    XLSX.writeFile(wb, 'SpendingData.xlsx');
})

// Nút xuất file PDF
$('#btn-pdf_export').click(function () {
    const doc = new jsPDF();

    // Lấy nội dung HTML của bảng
    const table = document.getElementById('tbdata');

    // Tạo tệp PDF từ bảng
    doc.autoTable({
        html: table,
        useCss: false,
        styles: { font: 'times' }
    });

    // Tải tệp PDF
    doc.save('Spending.pdf');
})


function onPageLoad() {
    // Đặt thời gian mặt định cho thẻ input
    $('#spendDate').val(formatDateForInput(formatDate(new Date())));

    // Hiển thị danh sách chi tiêu
    displaySpendingItems();

    // cuộn bảng xuống dưới
    scrollTableToBottom();
} onPageLoad();