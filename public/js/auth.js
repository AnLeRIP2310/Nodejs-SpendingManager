const urlapi = 'http://localhost:3962';
var ipcRenderer;

if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer = window.electron.ipcRenderer;
}

// Btn mở form đăng ký
$('#link_register').click(function () {
    // Đóng form đăng nhập
    $('.auth-form-login').css('animation', 'slideClose 0.4s ease forwards');
    // Mở form đăng ký
    setTimeout(() => {
        $('.auth-form-login').css('display', 'none');
        $('.auth-form-register').css('display', 'block');
        $('.auth-form-register').css('animation', 'slideOpen 0.4s ease forwards');
    }, 0.3 * 1000);
});

// Btn mở form đăng nhập
$('#link_login').click(() => {
    // Đóng form đăng ký
    $('.auth-form-register').css('animation', 'slideClose 0.4s ease forwards');
    // Mở form đăng nhập
    setTimeout(() => {
        $('.auth-form-register').css('display', 'none');
        $('.auth-form-login').css('display', 'block');
        $('.auth-form-login').css('animation', 'slideOpen 0.4s ease forwards');
    }, 0.3 * 1000);
})

// Btn Đăng nhập
$('#btn-login').click(() => {
    const username = $('#login_username');
    const password = $('#login_password');
    const remember = $('#login_remember').is(":checked")

    // Kiểm tra username và password không được trống
    username.toggleClass('is-invalid', username.val() === '');
    password.toggleClass('is-invalid', password.val() === '');

    // Nếu thông tin không hợp lệ, không thực hiện AJAX request
    if (username.val() === '' || password.val() === '') { return }

    const data = {
        username: username.val(),
        password: password.val(),
    }

    $.ajax({
        type: 'GET',
        url: urlapi + '/auth/login',
        data: data,
        success: function (res) {
            if (res.success) {
                let currentDate = new Date();

                const loginInfor = {
                    token: res.token,
                }

                if (remember == true) {
                    currentDate.setDate(currentDate.getDate() + 30); // Thêm 30 ngày vào currentDate
                    loginInfor.timeslife = formatDate(currentDate);
                } else {
                    currentDate.setDate(currentDate.getDate() + 1); // Thêm 1 ngày vào currentDate
                    loginInfor.timeslife = formatDate(currentDate);
                }

                localStorage.setItem('AuthToken', JSON.stringify(loginInfor));

                // Gửi thông điệp đến main process
                ipcRenderer.send('login-success');
            } else {
                $('#login_username').addClass('is-invalid');
                $('#login_password').addClass('is-invalid');
                showErrorToast('Sai tài khoản hoặc mật khẩu');
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
});

// Btn đăng ký
$('#btn-register').click(() => {
    const username = $('#register_username');
    const password = $('#register_password');
    const confirm = $('#register_confirm');

    // Kiểm tra tên đăng nhập không được trống và thêm/xóa lớp 'is-invalid'
    username.toggleClass('is-invalid', username.val() === '');

    // Kiểm tra mật khẩu và xác nhận mật khẩu không trùng nhau hoặc trống và thêm/xóa lớp 'is-invalid'
    const passwordsMatch = password.val() === confirm.val() && password.val() !== '' && confirm.val() !== '';
    password.toggleClass('is-invalid', !passwordsMatch);
    confirm.toggleClass('is-invalid', !passwordsMatch);

    // Nếu thông tin không hợp lệ, không thực hiện AJAX request
    if (username.val() === '' || !passwordsMatch) { return }

    const data = {
        username: username.val(),
        password: password.val()
    };

    $.ajax({
        type: 'POST',
        url: urlapi + '/auth/register',
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json',
        success: function (res) {
            if (res.success) {
                showSuccessToast('Đăng ký thành công');
                $('#link_login').click();
                // Điền sẵn dữ liệu
                $('#login_username').val(data.username);
                $('#login_password').val(data.password);
                // Xoá dữ liệu cũ
                $('#register_username').val('');
                $('#register_password').val('');
            } else {
                showErrorToast('Tài khoản đã tồn tại');
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
});

// Gọi event Đăng ký nếu Enter 
$('#register_username, #register_password, #register_confirm').on('keyup', function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();
        $('#btn-register').click();
    }
});

// Clear class 'is-invalid' khi gõ phím
$('#login_username, #login_password, #register_username, #register_password, #register_confirm').on('keyup', function () {
    if ($(this).hasClass('is-invalid')) {
        $(this).removeClass('is-invalid');
    }
})

// Gọi event Đăng Nhập nếu Enter 
$('#login_username, #login_password').on('keyup', function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();
        $('#btn-login').click();
    }
});

// Xử lý thông điệp từ cửa sổ popup
window.addEventListener('message', function (event) {
    const { data } = event;
    if (data && data.message === 'reload') {
        const loginInfor = {
            token: data.token,
        }

        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 30);
        loginInfor.timeslife = formatDate(currentDate);

        localStorage.setItem('AuthToken', JSON.stringify(loginInfor));

        // Gửi thông điệp đến main process
        ipcRenderer.send('login-success');
    }
});

// Hàm đăng nhập bằng google
function loginGoogle() {
    // Tạo urlpage
    $.get('http://localhost:3962/auth/urlPage', { urlpage: window.location.href });

    const width = 530;
    const height = 600;

    const popup = window.open(
        'http://localhost:3962/auth/loginGoogle',
        'google-login-popup',
        `width=${width},height=${height}`
    );

    if (window.focus && popup) {
        popup.focus();
    }

    return false;
};

// Btn đăng nhập bằng facebook
function loginFacebook() {
    // Tạo urlpage
    $.get('http://localhost:3962/auth/urlPage', { urlpage: window.location.href });

    const width = 750;
    const height = 600;

    const popup = window.open(
        'http://localhost:3962/auth/loginFacebook',
        'facebook-login-popup',
        `width=${width},height=${height}`
    );

    if (window.focus) {
        popup.focus();
    }

    return false;
};