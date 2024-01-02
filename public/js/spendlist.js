$(document).ready(function () {
    // Lắng nghe sự kiện khi click vào nút edit
    $('#spendlistTbl').on('click', '#btn-spendlist-edit', function () {
        var row = $(this).closest('tr');
        // Ẩn span và hiển thị input
        row.find('#tbl-spendlist-name').addClass('d-none');
        row.find('#tbl-spendlist-input').addClass('d-block');

        // Ẩn div chứa nút delete và edit, hiển thị div chứa nút save và close
        row.find('.group-btn_action').addClass('d-none');
        row.find('.group-btn_action-edit').addClass('d-block');
    });

    // Lắng nghe sự kiện khi click vào nút save hoặc close
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

    // Sự kiện click trên nút save
    $('#spendlistTbl').on('click', '#btn-spendlist-save', function () {
        var row = $(this).closest('tr');
        var Id = row.find('#tbl-spendlist-id').text();
        var inputValue = row.find('#tbl-spendlist-input').val();

        var data = {
            Id: Id,
            SpendName: inputValue
        };
        spendlistEdit(data);
    });
});


// Hàm cập nhật dữ liệu bảng chi tiêu(spendlist)
function spendlistEdit(data) {
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