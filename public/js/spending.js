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
        url: urlapi + '/spending/insertSpendingList',
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