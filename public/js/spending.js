//#region Add SpendList

// gọi hàm addSpendingList khi tương tác
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
                var lastOptionValue = $('#SpendingList option:last').val();
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

var tblOffset = 0; // Vị trí bắt đầu của dữ liệu cần tải
const tbLimit = 15; // Số lượng tin nhắn cần lấy mỗi lần
var lastScrollHeight = 0; // Lưu lại chiều cao trước khi thêm dữ liệu mới

// gọi sự kiện hàm hiển thị
$('#SpendingList').on('change', function () {
    // Đặt lại mặt định
    tblOffset = 0;
    lastScrollHeight = 0;
    // Clear dữ liệu cũ
    $('#tbody').empty();

    displaySpendingItems();
});

// Tải thêm spending khi cuộn table
$('#tbContainer').scroll(function () {
    if ($('#tbContainer').scrollTop() === 0) {
        // Lưu lại chiều cao trước khi thêm dữ liệu mới
        lastScrollHeight = $('#tbContainer')[0].scrollHeight;

        // Gửi yêu cầu để lấy dữ liệu cũ hơn từ máy chủ
        displaySpendingItems();
    }
});

// Hàm hiển thị spending cho spendlist
function displaySpendingItems() {
    const IdList = $('#SpendingList').val();

    $.ajax({
        type: 'POST',
        url: urlapi + '/spending/getSpendingForSpendList',
        data: { IdList, tblOffset, tbLimit },
        dataType: 'json',
        contentype: 'application/json',
        success: function (response) {
            // Đảo ngược thứ tự của mảng response.data
            var SpendingData = response.data.reverse();

            // Chỉnh sửa dữ liệu nhận được
            SpendingData.forEach((item) => {
                // Chuyển định dạng ngày
                item.AtCreate = formatDate(item.AtCreate);
                item.AtUpdate = formatDate(item.AtUpdate);
                // Định dạng giá tiền
                item.Price = formatCurrency(item.Price);
            });

            var source = $('#template-tbody').html();
            var convertSource = convertPlaceHbs(source);
            var template = Handlebars.compile(convertSource);
            var data = template({ spendItemByList: SpendingData });

            $('#tbody').prepend(data);

            // Cập nhật offset sau mỗi lần tải dữ liệu
            tblOffset += tbLimit;

            // Cuộn đến vị trí mà người dùng đang xem sau khi dữ liệu được cập nhật
            $('#tbContainer').scrollTop($('#tbContainer')[0].scrollHeight - lastScrollHeight);

            handleRowClickEvent(); // Thêm sự kiện click cho các row
            calculateTotalPrice(); //Gọi hàm tính tổng
        },
        error: function (err) {
            console.log(err);
        }
    });
}

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
    var expenseType = row.cells[2].innerText.toLowerCase();

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


//#region Search Table

// Hàm tìm kiếm trên table
function searchTable() {
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("txtSearch");
    filter = input.value.toUpperCase();
    table = document.getElementById("tbdata");
    tr = table.getElementsByTagName("tr");

    for (i = 0; i < tr.length; i++) {
        var visible = false; // Đặt biến để kiểm soát việc hiển thị

        // Duyệt qua tất cả các ô trong mỗi dòng
        for (var j = 0; j < tr[i].cells.length; j++) {
            td = tr[i].cells[j];
            if (td) {
                // Nếu dòng đang xét không phải là dòng tiêu đề, thực hiện tìm kiếm thông thường
                if (i > 0) {
                    txtValue = td.textContent || td.innerText;
                    // Nếu tìm thấy từ khóa trong bất kỳ cột nào, đặt biến visible thành true và thoát vòng lặp
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        visible = true;
                        break;
                    }
                } else {
                    // Nếu dòng đang xét là dòng tiêu đề, hiển thị nó luôn
                    visible = true;
                }
            }
        }

        // Thiết lập hiển thị dựa trên giá trị của biến visible
        tr[i].style.display = visible ? "" : "none";
    }
}
// Gọi hàm tìm kiếm
$('#txtSearch').on('keyup', function () {
    searchTable();
});
$('#txtSearch').on('blur', function () {
    searchTable();
});

//#endregion


//#region Auto Complete

// Hàm tạo danh sách auto complete
function getExpenseNames() {
    // Lấy danh sách các hàng trong tbody
    const tableBody = document.getElementById('tbody');
    const rows = tableBody.getElementsByTagName('tr');

    // Mảng chứa tên các khoản chi
    const expenseNames = [];

    // Lặp qua từng hàng để lấy tên khoản chi từ cột thứ 2 (index 1)
    for (let i = 0; i < rows.length; i++) {
        const cols = rows[i].getElementsByTagName('td');
        if (cols.length > 1) {
            // Thêm tên khoản chi vào mảng
            expenseNames.push(cols[1].innerText);
        }
    }
    // Gộp các tên trùng lặp thành một mảng duy nhất
    const uniqueExpenseNames = Array.from(new Set(expenseNames));

    return uniqueExpenseNames;
}

// hàm gợi ý từ trong field
function spendingSuggest() {
    var data = getExpenseNames();

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
        if (e.key === "Tab") {
            //e.preventDefault();
            var suggestionsList = $(".autocomplete-suggestions");
            if (suggestionsList.length > 0) {
                var matchingSuggestion = suggestionsList.find(".autocomplete-suggestion").first();
                if (matchingSuggestion.length > 0) {
                    matchingSuggestion.click();
                }
            }
        }
    });
}

//#endregion


//#region Button Add, Update, Delete, Clear

const OldData = [
    {
        "date": "2022-11-22T00:00:00",
        "name": "Xăng",
        "price": 50000,
        "moreInfo": "Không có thông tin"
    },
    {
        "date": "2022-11-22T00:00:00",
        "name": "Thay Ruột Xe",
        "price": 80000,
        "moreInfo": "Không có thông tin"
    },
    {
        "date": "2022-11-22T00:00:00",
        "name": "Ăn Trưa",
        "price": 20000,
        "moreInfo": "Không có thông tin"
    },
    {
        "date": "2022-11-22T00:00:00",
        "name": "Ăn Tối",
        "price": 20000,
        "moreInfo": "Không có thông tin"
    },
    {
        "date": "2022-11-22T00:00:00",
        "name": "Nước",
        "price": 10000,
        "moreInfo": "Không có thông tin"
    },
]

function test() {
    OldData.forEach(function (item) {
        const data = {
            ListId: $('#SpendingList').val(),
            Name: item.name,
            Price: item.price,
            Details: item.moreInfo,
            AtCreate: item.date,
            AtUpdate: item.date,
            Status: 1
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
                    const data = res.data[0];
                    data.AtUpdate = formatDate(data.AtUpdate);
    
                    // Tạo HTML cho hàng mới
                    var newRow = `<tr class ="pointer">
                                    <th scope="row">${data.Id}</th>
                                    <td>${data.AtUpdate}</td>
                                    <td>${data.NameItem}</td>
                                    <td>${formatCurrency(data.Price)}</td>
                                    <td>${data.Details}</td>
                                </tr>`;
                    // Thêm hàng mới vào bảng
                    $('#tbdata tbody').append(newRow);
    
                    scrollTableToBottom(); // cuộn xuống cuối
                    handleRowClickEvent(); // gắn sự kiện click cho row
                    calculateTotalPrice() // Tính tổng tiền trên danh sách
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });
}



// nút thêm dữ liệu vào bảng
$('#btnCreate').on('click', function () {
    const data = {
        ListId: $('#SpendingList').val(),
        Name: $('#spendName').val(),
        Price: $('#spendPrice').val(),
        Details: ($('#spendDetails').val() === null || $('#spendDetails').val() === "") ? "Không có thông tin" : $('#spendDetails').val(),
        AtCreate: $('#spendDate').val(),
        AtUpdate: $('#spendDate').val(),
        Status: 1,
    };

    $.ajax({
        type: 'POST',
        url: urlapi + '/spending/insertSpending',
        data: data,
        dataType: 'json',
        contentype: 'application/json',
        success: function (res) {
            if (res.success == true) {
                // Dữ liệu trả về từ server
                const data = res.data[0];
                data.AtUpdate = formatDate(data.AtUpdate);

                // Tạo HTML cho hàng mới
                var newRow = `<tr class ="pointer">
                                <th scope="row">${data.Id}</th>
                                <td>${data.AtUpdate}</td>
                                <td>${data.NameItem}</td>
                                <td>${formatCurrency(data.Price)}</td>
                                <td>${data.Details}</td>
                            </tr>`;
                // Thêm hàng mới vào bảng
                $('#tbdata tbody').append(newRow);

                scrollTableToBottom(); // cuộn xuống cuối
                handleRowClickEvent(); // gắn sự kiện click cho row
                calculateTotalPrice() // Tính tổng tiền trên danh sách
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
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
})

// nút xoá dữ liệu trong bảng
$('#btnDelete').on('click', function () {
    const data = {
        Id: $('#spendId').val(),
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
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
});

// nút clear data
$('#btnClearData').on('click', function () {
    $('#spendId').val('');
    $('#spendDate').val(formatDateForInput(formatDate(new Date())));
    $('#spendName').val('');
    $('#spendPrice').val('');
    $('#spendDetails').val('');
});

// Gọi Sk Thêm dữ liệu trên input
$('#spendName, #spendPrice, #spendDetails').on('keyup', function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();

        if ($('#spendName').val() === '') { return }
        $('#btnCreate').click();
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