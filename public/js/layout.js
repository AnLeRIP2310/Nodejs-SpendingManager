const urlapi = 'http://localhost:3962';
var ipcRenderer = window.Electron?.ipcRenderer;

if (ipcRenderer) {
    // Nhận sự kiện đóng ứng dụng hay thu xuống khay
    ipcRenderer.on('before-closeApp', () => {
        $('#modalConfirmExit').modal('show')
    })
}

// Sự kiện đóng ứng dụng
$('#btnExit').click(() => {
    ipcRenderer.send('quit-app', $('#remember_choice_exit').prop('checked'));
});
$('#btnTray').click(() => {
    $('#modalConfirmExit').modal('hide')

    ipcRenderer.send('collapse-tray', $('#remember_choice_exit').prop('checked'));
});



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


// -----------Load Page----------------

// Page Home
$('#page-home').click(function () {
    const fakeData = [{}, {}, {}, {}, {}, {}]

    fetch('templates/home.hbs')
        .then(response => response.text())
        .then(template => {
            const compiledTemplate = Handlebars.compile(template);
            const html = compiledTemplate({
                fakeData: fakeData
            });
            $('#page-content').html(html);
            applyLanguage(settingsObj.language);
        })
        .catch(error => console.error('Error:', error));
})

// Page Spending
$('#page-spending').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/spending/getData',
        success: function (res) {
            fetch('templates/spending.hbs')
                .then(response => response.text())
                .then(template => {
                    const compiledTemplate = Handlebars.compile(template);
                    const html = compiledTemplate({
                        spendingList: res.data.spendingList
                    });
                    $('#page-content').html(html);
                    applyLanguage(settingsObj.language);
                })
                .catch(error => console.error('Error:', error));
        },
        error: function (err) {
            console.log(err);
        }
    })
})

// Page statics
$('#page-statics').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/spending/getData',
        success: function (res) {
            fetch('templates/statics.hbs')
                .then(response => response.text())
                .then(template => {
                    const compiledTemplate = Handlebars.compile(template);
                    const html = compiledTemplate({
                        spendingList: res.data.spendingList
                    });
                    $('#page-content').html(html);
                    applyLanguage(settingsObj.language);
                })
                .catch(error => console.error('Error:', error));
        },
        error: function (err) {
            console.log(err);
        }
    })
})

// Page Spendlist
$('#page-spendlist').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/spendlist/getData',
        success: function (res) {
            res.data.forEach((item) => {
                item.status = item.status == 1 ? 'Actived' : 'Disable';
                item.totalprice = formatCurrency(item.totalprice);
            });

            fetch('templates/spendlist.hbs')
                .then(response => response.text())
                .then(template => {
                    const compiledTemplate = Handlebars.compile(template);
                    const html = compiledTemplate({
                        spendList: res.data
                    });
                    $('#offcanvasSpendlist').html(html);
                    applyLanguage(settingsObj.language);
                })
        },
        error: function (err) {
            console.log(err);
        }
    })
});

// Page Setting
let pageSetting = false;
$('#page-setting').click(function () {
    if (!pageSetting) {
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


// Page Noted
$('#page-noted').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/noted/getData',
        success: function (res) {
            res.data.notedlist.forEach((item) => {
                item.atcreate = formatDate(item.atcreate)
                item.atupdate = formatDate(item.atupdate)
            })

            fetch('templates/noted.hbs')
                .then(response => response.text())
                .then(template => {
                    const compiledTemplate = Handlebars.compile(template);
                    const html = compiledTemplate({
                        notedList: res.data.notedlist
                    });
                    $('#page-content').html(html);
                    applyLanguage(settingsObj.language);
                })
        },
        error: function (err) {
            console.log(err);
        }
    })


})


// mở cài đặt
// var offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasSetting'));
// offcanvas.show()

// Mở spendlist
// $('#page-spendlist').click();
// var offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasSpendlist'));
// offcanvas.show()