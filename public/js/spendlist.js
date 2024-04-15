var curentListId = 0; // Biến lưu id danh sách muốn xoá
var curentlistRow; // Biến lưu row danh sách muốn xoá

$(document).ready(function () {
    // Sự kiện click nút edit trên bảng
    $('#spendlistTbl').on('click', '#btn-spendlist-edit', function () {
        var row = $(this).closest('tr');
        // Ẩn span và hiển thị input
        row.find('#tbl-spendlist-name').addClass('d-none');
        row.find('#tbl-spendlist-input').addClass('d-block');

        // Ẩn div chứa nút delete và edit, hiển thị div chứa nút save và close
        row.find('.group-btn_action').addClass('d-none');
        row.find('.group-btn_action-edit').addClass('d-block');
    });

    // Sự kiện click nút save trên bảng
    $('#spendlistTbl').on('click', '#btn-spendlist-save', function () {
        var row = $(this).closest('tr');
        var Id = row.find('#tbl-spendlist-id').text();
        var inputValue = row.find('#tbl-spendlist-input').val();
        var displayValue = row.find('#tbl-spendlist-name').text();

        var data = {
            Id: Id,
            SpendName: inputValue
        };

        // Kiểm tra nếu không có sự thay đổi giá trị thì không gọi hàm
        if (inputValue != displayValue) {
            editSpendlist(data);
        }
    });

    // Sự kiện click vào nút save hoặc close trên bảng
    $('#spendlistTbl').on('click', '#btn-spendlist-save, #btn-spendlist-cancel', function () {
        var row = $(this).closest('tr');
        // Ẩn div chứa nút save và close, hiển thị div chứa nút delete và edit
        row.find('.group-btn_action-edit').removeClass('d-block');
        row.find('.group-btn_action').removeClass('d-none');

        // Lấy giá trị từ input và hiển thị lại trong span
        var inputValue = row.find('#tbl-spendlist-input').val();
        row.find('#tbl-spendlist-name').text(inputValue).removeClass('d-none');
        row.find('#tbl-spendlist-input').removeClass('d-block');
    });

    // Sự kiện click nút del trên bảng
    $('#spendlistTbl').on('click', '#btn-spendlist-delete', function () {
        var row = $(this).closest('tr'); curentlistRow = row;
        curentListId = row.find('#tbl-spendlist-id').text();

        if(settingsObj.reminderDelete == true || settingsObj.reminderDelete == 'true') {
            $('#modalConfirmDeleteList').modal('show')
        } else {
            $(this).closest('tr').remove();
            delSpendlist(curentListId);
        }
    });
});

// Nút xác nhận xoá danh sách
$('#btnConfirmDeleteList').click(function () {
    // Kiểm tra xem có tick vào ô tắt thông báo không
    if ($('#reminderDeleteList').prop('checked')) {
        settingsObj.reminderDelete = false;
        editSettings('reminderDelete', false, 'App', reminderDelete);
        $('#reminderDeleteList').prop('checked', false);
    }

    curentlistRow.remove(); // Xoá danh sách trên giao diện
    delSpendlist(curentListId);
    $('#modalConfirmDeleteList').modal('hide')
});

// Hàm xoá danh sách chi tiêu
function delSpendlist(id) {
    $.ajax({
        type: 'POST',
        url: urlapi + '/spendlist/delSpendlist',
        data: JSON.stringify({ Id: id }),
        dataType: 'json',
        contentType: 'application/json',
        success: function (res) {
            if (res.success) {
                showSuccessToast('Xóa danh sách thành công');
            } else {
                showErrorToast('Xoá danh sách thất bại');
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
}

// Hàm cập nhật dữ liệu bảng chi tiêu(spendlist)
function editSpendlist(data) {
    $.ajax({
        type: 'POST',
        url: urlapi + '/spendlist/editSpendlist',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
        success: function (res) {
            if (res.success) {
                showSuccessToast('Cập nhật tên danh sách thành công');
            } else {
                showErrorToast('Cập nhật tên danh sách thất bại');
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

var isOpenForm = false;
$('#btn-spendlist-open_form').click(function () {
    if (!isOpenForm) {
        $('.form-addSpendlist').css('animation', 'sideslip_on .5s ease forwards')
        isOpenForm = true;
    } else {
        $('.form-addSpendlist').css('animation', 'sideslip_off .5s ease forwards')
        isOpenForm = false;
    }
})

// Btn thêm danh sách mới
$('#btn-spendlist-add').click(function () {
    const data = {
        token: JSON.parse(localStorage.getItem('AuthToken')).token,
        namelist: $('#tbl-spendlist-add').val(),
        atcreate: formatDate(new Date()),
        status: 1
    }

    if (data.namelist == '') {
        showErrorToast('Vui lòng nhập tên sách');
        return;
    }

    $.ajax({
        type: 'POST',
        url: urlapi + '/spending/insertSpendList',
        data: data,
        dataType: 'json',
        contentype: 'application/json',
        success: function (data) {
            if (data.success == true) {
                $('#tbl-spendlist-add').val('');
                showSuccessToast('Thêm danh sách thành công');

                $('.form-addSpendlist').css('animation', 'sideslip_off .5s ease forwards')
                isOpenForm = true;
            } else {
                showErrorToast('Thêm danh sách thất bai');
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
});