const urlapi = 'http://localhost:3962';

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



// -----------Load Page----------------

// Page Home
$('#page-home').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/spending/getData',
        data: {
            token: JSON.parse(localStorage.getItem('AuthToken')).token
        },
        success: function (res) {
            fetch('templates/home.hbs')
                .then(response => response.text())
                .then(template => {
                    const compiledTemplate = Handlebars.compile(template);
                    const html = compiledTemplate({
                        spendingList: res.spendingList
                    });
                    $('#page-content').html(html);
                })
                .catch(error => console.error('Error:', error));
        },
        error: function (err) {
            console.log(err);
        }
    })
})

// Page Spending
$('#page-spending').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/spending/getData',
        data: {
            token: JSON.parse(localStorage.getItem('AuthToken')).token
        },
        success: function (res) {
            fetch('templates/spending.hbs')
                .then(response => response.text())
                .then(template => {
                    const compiledTemplate = Handlebars.compile(template);
                    const html = compiledTemplate({
                        spendingList: res.spendingList
                    });
                    $('#page-content').html(html);
                })
                .catch(error => console.error('Error:', error));
        },
        error: function (err) {
            console.log(err);
        }
    })
})

// Page Statisc
$('#page-statisc').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/spending/getData',
        data: {
            token: JSON.parse(localStorage.getItem('AuthToken')).token
        },
        success: function (res) {
            fetch('templates/statisc.hbs')
                .then(response => response.text())
                .then(template => {
                    const compiledTemplate = Handlebars.compile(template);
                    const html = compiledTemplate({
                        spendingList: res.spendingList
                    });
                    $('#page-content').html(html);
                })
                .catch(error => console.error('Error:', error));
        },
        error: function (err) {
            console.log(err);
        }
    })
})

// Page Profile
$('#page-profile').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/profile/getData',
        data: {
            token: JSON.parse(localStorage.getItem('AuthToken')).token
        },
        success: function (res) {
            if (res.data[0].Avatar == null) {
                res.data[0].Avatar = urlapi + '/images/defaultAvatar.jpg';
            }

            fetch('templates/profile.hbs')
                .then(response => response.text())
                .then(template => {
                    const compiledTemplate = Handlebars.compile(template);
                    const html = compiledTemplate({
                        userInfor: res.data
                    });
                    $('#offcanvasProfile').html(html);
                })
                .catch(error => console.error('Error:', error));
        },
        error: function (err) {
            console.log(err);
        }
    })
})

// $('#page-profile').click();



// mở cài đặt
// var offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasSetting'));
// offcanvas.show()


// ---------- Load Settings --------------


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
    darkModeSetting();
    defaultPageSetting();
    defaultActionSetting();
    languageSetting();
    tooltipSetting();
} loadSettingApp();


// xử lý cài đặt darkMode
function darkModeSetting() {
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
        $('#darkModeToggle').prop('checked', false);
        // Bỏ áp dụng các thuộc tính
        $('html').attr('data-bs-theme', 'light');
        $('#appcontainer').removeClass('bg-secondary-subtle')
        $('#appcontainer').addClass('bg-black');
        $('.table').removeClass('table-dark');
        $('#appcontent').addClass('bg-white');
        $('#appcontent').removeClass('bg-black');
        $('.sidebar').removeClass('bg-secondary');
    }
}

// xử lý cài đặt defaultPage
function defaultPageSetting() {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    switch (SettingApp.defalutPage) {
        case 'home':
            $('#page-home').click();
            $('#st_defaultPage').val('home');
            break;
        case 'spending':
            $('#page-spending').click();
            $('#st_defaultPage').val('spending');
            break;
        case 'spendlist':
            $('#page-spendlist').click();
            $('#st_defaultPage').val('spendlist');
            break;
        case 'statisc':
            $('#page-statisc').click();
            $('#st_defaultPage').val('statisc');
            break;
        case 'profile':
            $('#page-profile').click();
            $('#st_defaultPage').val('profile');
            break;
    }
}

// xử lý cài đặt defaultAction
function defaultActionSetting() {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    switch (SettingApp.defaultAction) {
        case 'add':
            $('#st_defaultAction').val('add');
            break;
        case 'edit':
            $('#st_defaultAction').val('edit');
            break;
        case 'del':
            $('#st_defaultAction').val('del');
            break;
    }
}

// xử lý cài đặt language
function languageSetting() {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    switch (SettingApp.language) {
        case 'vi':
            $('#st_language').val('vi');
            break;
        case 'en':
            $('#st_language').val('en');
            break;
    }
}

// xử ly cài đặt tooltip
function tooltipSetting() {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));

    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    if (SettingApp.tooltip) {
        $('#st_tooltip').prop('checked', true);

        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    } else {
        $('#st_tooltip').prop('checked', false);
        // var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            var popover = bootstrap.Popover.getInstance(popoverTriggerEl);
            if (popover) {
                popover.dispose(); // Loại bỏ các popovers đã khởi tạo
            }
        });
    }
}

// sự kiện bật/tắt darkmode
$('#darkModeToggle').on('change', function () {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    SettingApp.darkMode = this.checked;
    localStorage.setItem('SettingApp', JSON.stringify(SettingApp));
    darkModeSetting();
});

// Sự kiện chọn trang mặt định
$('#st_defaultPage').on('change', function () {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    SettingApp.defalutPage = this.value;
    localStorage.setItem('SettingApp', JSON.stringify(SettingApp));
    defaultPageSetting();
});

// Sự kiện chọn hành động mặt định
$('#st_defaultAction').on('change', function () {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    SettingApp.defaultAction = this.value;
    localStorage.setItem('SettingApp', JSON.stringify(SettingApp));
    defaultActionSetting();
});

// Sự kiện chọn ngôn ngữ mặt định
$('#st_language').on('change', function () {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    SettingApp.language = this.value;
    localStorage.setItem('SettingApp', JSON.stringify(SettingApp));
    languageSetting();
});

// Sự kiện bật/tắt tooltip
$('#st_tooltip').on('change', function () {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    SettingApp.tooltip = this.checked;
    localStorage.setItem('SettingApp', JSON.stringify(SettingApp));
    tooltipSetting();
});

// Sự kiện đặt lại cài đặt mặt định
$('#btn-reset_setting').click(function () {
    localStorage.removeItem('SettingApp');
    location.reload();
});


