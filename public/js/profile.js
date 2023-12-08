// mở hồ sơ người dùng
// var offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasProfile'));
// offcanvas.show()

// Nút đổi mật khẩu
$('#btnChangePassword').click(function () {
    const oldPassword = $('#oldPassword').val();
    const newPassword = $('#newPassword').val();
    const confirmPassword = $('#confirmPassword').val();
    const token = JSON.parse(localStorage.getItem('AuthToken')).token;

    const fields = [{ field: 'oldPassword', value: oldPassword },
    { field: 'newPassword', value: newPassword },
    { field: 'confirmPassword', value: confirmPassword }];

    fields.forEach(field => {
        if (field.value === '') {
            $(`#${field.field}`).addClass('is-invalid');
        } else {
            $(`#${field.field}`).removeClass('is-invalid');
        }
    });

    if (newPassword !== confirmPassword) {
        $('#confirmPassword').addClass('is-invalid');
        return;
    }

    const data = { oldPassword, newPassword, token };

    $.ajax({
        url: urlapi + '/profile/changePassword',
        method: 'POST',
        data: data,
        success: function (res) {
            res.success ? showSuccessToast(res.message) : showErrorToast(res.message);
        },
        error: function (err) {
            console.log(err);
        }
    });
});


$('#oldPassword, #newPassword, #confirmPassword').on('input', function () {
    $(this).removeClass('is-invalid');
});