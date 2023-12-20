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

let pageProfile = false;
let pageSetting = false;

// Page Profile
$('#page-profile').click(function () {
    if (pageProfile == false) {
        pageProfile = true;

        $.ajax({
            type: 'GET',
            url: urlapi + '/profile/getData',
            data: {
                token: JSON.parse(localStorage.getItem('AuthToken')).token
            },
            success: function (res) {
                console.log(res)

                if (res.success) {
                    if (res.data[0].avatar == null) {
                        res.data[0].avatar = urlapi + '/images/defaultAvatar.jpg';
                    }

                    if (res.data[0].displayname == null) {
                        res.data[0].displayname = res.data[0].username
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
                } else {
                    showWarningToast('Lấy thông tin người dùng thất bại')
                }
            },
            error: function (err) {
                console.log(err);
            }
        })
    }
})

// Page Setting
$('#page-setting').click(function () {
    if (pageSetting == false) {
        pageSetting = true;

        fetch('templates/setting.hbs')
            .then(response => response.text())
            .then(template => {
                const compiledTemplate = Handlebars.compile(template);
                const html = compiledTemplate();
                $('#offcanvasSetting').html(html);
            })
    }
}); $('#page-setting').click();


// mở cài đặt
// var offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasSetting'));
// offcanvas.show()