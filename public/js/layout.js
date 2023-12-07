var ipcRenderer;

if (window.electron && window.electron.ipcRenderer) {
    ipcRenderer = window.electron.ipcRenderer;
}


// js thanh sidebar
// Lấy tất cả các phần tử có class 'sidebar-item'
const sidebarItems = document.querySelectorAll('.sidebar-item');
const sidebarItemE = document.querySelectorAll('.sidebar-item-e');

sidebarItemE.forEach(item => {
    item.onmouseenter = function () {
        const speech = this.querySelector('.speech');
        speech.style.animation = 'slideIn 0.3s ease forwards';
        speech.style.opacity = '1';
        speech.addEventListener('animationend', function () {
            speech.style.animation = ''; // Reset animation khi hoàn thành
        }, { once: true }); // Sử dụng { once: true } để chỉ chạy một lần
    };

    item.onmouseleave = function () {
        const speech = this.querySelector('.speech');
        speech.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            speech.style.opacity = '0'; // Thiết lập opacity sau khi animation hoàn thành
        }, 300);
    };
});
// Lặp qua từng phần tử và thêm các sự kiện hover và rời khỏi
sidebarItems.forEach(item => {
    item.onmouseenter = function () {
        const speech = this.querySelector('.speech');
        speech.style.animation = 'slideIn 0.3s ease forwards';
        speech.style.opacity = '1';
        speech.addEventListener('animationend', function () {
            speech.style.animation = ''; // Reset animation khi hoàn thành
        }, { once: true }); // Sử dụng { once: true } để chỉ chạy một lần
    };

    item.onmouseleave = function () {
        const speech = this.querySelector('.speech');
        speech.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            speech.style.opacity = '0'; // Thiết lập opacity sau khi animation hoàn thành
        }, 300);
    };
});

// Lặp qua từng phần tử và thêm sự kiện click
sidebarItems.forEach(item => {
    item.addEventListener('click', function () {
        // Loại bỏ màu sắc hiện tại của tất cả các sidebar-item
        sidebarItems.forEach(i => {
            i.classList.remove('sidebar-item-Active');
        });

        // Đặt màu sắc mới cho sidebar-item được click
        this.classList.add('sidebar-item-Active');
    });
});

function checkIsLogin() {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (localStorage.getItem('AuthToken') != null) {
        const AuthToken = JSON.parse(localStorage.getItem('AuthToken'));

        // Kiểm tra token có chính xác không
        if (AuthToken.token) {
            $.ajax({
                type: 'GET',
                url: 'http://localhost:3962/auth/checkToken',
                data: {
                    token: AuthToken.token
                },
                success: function (res) {
                    if (res.success) {
                        // Kiểm tra xem token còn hiệu lực không
                        var currentDate = new Date(formatDateForInput(formatDate(new Date()))).getTime();
                        var storedDate = new Date(formatDateForInput((AuthToken.timeslife))).getTime();

                        if (currentDate > storedDate) {
                            localStorage.removeItem('AuthToken');
                            // Gửi thông điệp đến main process
                            ipcRenderer.send('login-expired');
                        }
                    } else {
                        localStorage.removeItem('AuthToken');
                        // Gửi thông điệp đến main process
                        ipcRenderer.send('login-expired');
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            })
        } else {
            localStorage.removeItem('AuthToken');
            // Gửi thông điệp đến main process
            ipcRenderer.send('login-expired');
        }
    } else {
        // Gửi thông điệp đến main process
        ipcRenderer.send('login-expired');
    }
} checkIsLogin();

// Btn đăng xuất
$('#page-logout').click(() => {
    console.log('Đã click');

    localStorage.removeItem('AuthToken');
    // Gửi thông điệp đến main process
    ipcRenderer.send('login-expired');
})


// $(document).tooltip()





// Load Setting App
function loadSettingApp() {
    // Kiểm tra xem đã tồn tại cấu hình cài đặt chưa
    if (localStorage.getItem('SettingApp') == null) {
        const userSetting = {
            darkMode: false,
            defalutPage: 'home',
            defaultAction: 'add',
            language: 'vi',
            tooltip: true
        }

        localStorage.setItem('SettingApp', JSON.stringify(userSetting));
    }

    // Áp dụng cài đặt
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));

    if (SettingApp.darkMode) {
        $('#darkModeToggle').prop('checked', true);

        // Áp dụng các thuột tính dark mode
        $('html').attr('data-bs-theme', 'dark');
        $('#appcontainer').addClass('bg-secondary-subtle')
        $('#appcontainer').removeClass('bg-black');
        $('.table').addClass('table-dark');
        $('#appcontent').addClass('bg-black');
        $('#appcontent').removeClass('bg-white');
        $('.sidebar').addClass('bg-secondary');
    } else {
        $('html').attr('data-bs-theme', 'light');
        $('#appcontainer').removeClass('bg-secondary-subtle')
        $('#appcontainer').addClass('bg-black');
        $('.table').removeClass('table-dark');
        $('#appcontent').addClass('bg-white');
        $('#appcontent').removeClass('bg-black');
        $('.sidebar').removeClass('bg-secondary');
    }

} loadSettingApp();

// sự kiện bật tắt darkmode
$('#darkModeToggle').on('change', function () {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    SettingApp.darkMode = this.checked;
    localStorage.setItem('SettingApp', JSON.stringify(SettingApp));
    loadSettingApp();
});

