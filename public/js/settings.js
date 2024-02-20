var settingsObj;
// Tải cấu hình ứng dụng và gán vào biến
function loadSettings() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/getData',
        success: function (res) {
            if (res != null) {
                settingsObj = res.iniObject.App;
                $('#st_dbPath').val(res.dbPath);

                darkModeSetting();
                defaultPageSetting();
                defaultActionSetting();
                languageSetting();
                reminderDelete();
                tooltipSetting();
                closeDefaultSetting();
                allowNotifySetting();
                startWithWindowSetting();

            } else {
                showErrorToast('Tải cài đặt ứng dụng thất bại')
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
} loadSettings();


// Chỉnh sửa/cập nhật cấu hình
function editSettings(name, value, group, callback) {
    $.ajax({
        type: 'POST',
        url: urlapi + '/setting/editData',
        data: { name, value, group },
        success: function (res) {
            if (res.success) {
                callback();
            } else {
                showErrorToast('Áp dụng cài đặt thất bại')
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
}

// Hàm áp dụng darkmode
function applyTheme(theme) {
    const isDark = theme === 'dark';

    $('html').attr('data-bs-theme', theme);
    $('#appcontainer').toggleClass('bg-secondary-subtle', isDark);
    $('#appcontainer').toggleClass('bg-black', !isDark);
    $('.table').toggleClass('table-dark', isDark);
    $('#appcontent').toggleClass('bg-black', isDark);
    $('#appcontent').toggleClass('bg-white', !isDark);
    $('.sidebar').toggleClass('bg-secondary', isDark);
}
function applyAutoTheme() {
    ipcRenderer.send('get-system-theme')
    ipcRenderer.on('reply-system-theme', (event, res) => {
        applyTheme(res ? 'dark' : 'light');
    });
}

// xử lý cài đặt darkMode
function darkModeSetting() {
    if (settingsObj.darkMode == 'auto') {
        $('#st_darkMode').val('auto');
        applyAutoTheme();
    } else {
        $('#st_darkMode').val(settingsObj.darkMode);
        applyTheme(settingsObj.darkMode);
    }
}

// sự kiện bật/tắt darkmode
$('#st_darkMode').on('change', function () {
    settingsObj.darkMode = this.value;
    editSettings('darkMode', this.value, 'App', darkModeSetting)
});

// xử lý cài đặt defaultPage
function defaultPageSetting() {
    $('#page-' + settingsObj.defaultPage).click();
    $('#st_defaultPage').val(settingsObj.defaultPage);
}

// Sự kiện chọn trang mặt định
$('#st_defaultPage').on('change', function () {
    settingsObj.defaultPage = this.value;
    editSettings('defaultPage', this.value, 'App', defaultPageSetting)
});

// xử lý cài đặt defaultAction
function defaultActionSetting() {
    switch (settingsObj.defaultAction) {
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

// Sự kiện chọn hành động mặt định
$('#st_defaultAction').on('change', function () {
    settingsObj.defaultAction = this.value;
    editSettings('defaultAction', this.value, 'App', defaultActionSetting)
});

// xử lý cài đặt language
function languageSetting() {
    switch (settingsObj.language) {
        case 'vi':
            $('#st_language').val('vi');
            break;
        case 'en':
            $('#st_language').val('en');
            break;
    }
}

// Sự kiện chọn ngôn ngữ mặt định
$('#st_language').on('change', function () {
    settingsObj.language = this.value;
    editSettings('language', this.value, 'App', languageSetting)
});

// xử lý cài dặt reminder
function reminderDelete() {
    if (settingsObj.reminderDelete == true || settingsObj.reminderDelete == 'true') {
        $('#st_reminder').prop('checked', true);
        $('label[for="st_reminder"]').text('Đang bật')
    } else {
        $('#st_reminder').prop('checked', false);
        $('label[for="st_reminder"]').text('Đã tắt')
    }
}

// Sự kiện bật/tắt reminder
$('#st_reminder').on('change', function () {
    settingsObj.reminderDelete = this.checked;
    editSettings('reminderDelete', this.checked, 'App', reminderDelete)
})

// xử ly cài đặt tooltip
function tooltipSetting() {
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    if (settingsObj.tooltip == true || settingsObj.tooltip == 'true') {
        $('#st_tooltip').prop('checked', true);
        $('label[for="st_tooltip"]').text('Đang bật')
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    } else {
        $('#st_tooltip').prop('checked', false);
        $('label[for="st_tooltip"]').text('Đã tắt')
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            var popover = bootstrap.Popover.getInstance(popoverTriggerEl);
            if (popover) {
                popover.dispose(); // Loại bỏ các popovers đã khởi tạo
            }
        });
    }
}

// Sự kiện bật/tắt tooltip
$('#st_tooltip').on('change', function () {
    settingsObj.tooltip = this.checked;
    editSettings('tooltip', this.checked, 'App', tooltipSetting)
});

// Xử lý cài đặt defaultClose
function closeDefaultSetting() {
    switch (settingsObj.closeDefault) {
        case 'ask':
            $('#st_closeDefault').val('ask');
            break;
        case 'quit':
            $('#st_closeDefault').val('quit');
            break;
        case 'tray':
            $('#st_closeDefault').val('tray');
            break;
    }
}

// Sự kiện chọn hành động khi thoát
$('#st_closeDefault').on('change', function () {
    settingsObj.closeDefault = this.value;
    editSettings('closeDefault', this.value, 'App', closeDefaultSetting)
});

// Xử lý cài đặt notifySpend
function allowNotifySetting() {
    if (settingsObj.notifySpend == true || settingsObj.notifySpend == 'true') {
        $('#st_notifySpend').prop('checked', true);
        $('label[for="st_notifySpend"]').text('Đang bật')
    } else {
        $('#st_notifySpend').prop('checked', false);
        $('label[for="st_notifySpend"]').text('Đã tắt')
    }
}

// Sự kiện nhắt nhở thông báo
$('#st_notifySpend').on('change', function () {
    settingsObj.notifySpend = this.checked;
    editSettings('notifySpend', this.checked, 'App', allowNotifySetting)
});

// Xử lý cài đặt StartWithWindow
function startWithWindowSetting() {
    if (settingsObj.startWithWindow == true || settingsObj.startWithWindow == 'true') {
        $('#st_startWithWindow').prop('checked', true);
        $('label[for="st_startWithWindow"]').text('Đang bật')
    } else {
        $('#st_startWithWindow').prop('checked', false);
        $('label[for="st_startWithWindow"]').text('Đã tắt')
    }
}

// Sự kiện cài đặt StartWithWindow
$('#st_startWithWindow').on('change', function () {
    settingsObj.startWithWindow = this.checked;
    editSettings('startWithWindow', this.checked, 'App', startWithWindowSetting)
    // Gửi sự kiện đến main process để xử lý
    if (ipcRenderer != null)
        ipcRenderer.send('startWithWindow')
});

// Sự kiện đặt lại cài đặt mặt định
$('#btn-reset_setting').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/resetData',
        success: function (res) {
            if (res.success) {
                showSuccessToast('Đặt lại cài đặt ứng dụng thành công');
                loadSettings();

                if (res.action == 'reload') { ipcRenderer.send('reload-app') }

                // fix lỗi element bị treo khi reset
                $('.popover.bs-popover-auto.fade.show').remove();
            }
        },
        error: function (err) {
            console.log(err);
            showErrorToast('Không thể đặt lại cài đặt ứng dụng');
        }
    })
});

// Sự kiện xuất file db
$('#btn-export_db').click(function () {
    ipcRenderer.send('export-db');
});


// Sự kiện nhập file db
$('#btn-import_db').click(function () {
    $('#modalConfirmImport').modal('show');
})
$('#btnConfirmImport').click(function () {
    ipcRenderer.send('import-db');
});


// Sự kiện chọn thư mục lưu trữ dữ liệu
$('#btn-dbPath').click(function () {
    ipcRenderer.send('change-dbPath');
});


// btn Đăng nhập vào google drive
$('#btn-syncData-Login').click(function () {
    $.get('http://localhost:3962/auth/urlPage', { urlpage: window.location.href });

    if (ipcRenderer == null) {
        const width = 530;
        const height = 600;

        const popup = window.open(
            urlapi + '/auth/loginGGDrive',
            'google-login-popup',
            `width=${width},height=${height}`
        );

        if (window.focus && popup) {
            popup.focus();
        }

        return false;
    } else {
        ipcRenderer.send('loginGGDrive', urlapi + '/auth/loginGGDrive');
    }
});


// Btn đăng xuất khỏi google drive
$('#btn-syncData-Logout').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/auth/logoutGGDrive',
        success: function (res) {
            if (res.success) {
                checkSyncStatus();
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
});


// Hàm xử lý chức năng đồng bộ
async function handleSyncData(dataObj) {
    // Tổng số mục cần thực hiện
    const totalProcess = dataObj.spendingItem.length + dataObj.spendingList.length;
    let currentProcess = 0;

    // Hiển thị thanh tiến trình
    $('#syncData-Progress').removeClass('d-none');

    function updateProgress() {
        currentProcess++;
        const successProcess = Math.floor((currentProcess / totalProcess) * 100);
        $('#syncData-Progress .progress-bar').css('width', successProcess + '%');
        $('#syncData-Progress .progress-bar').text(`${successProcess}%`);
        $('#syncStatus').html(`Đang đồng bộ ${currentProcess}/${totalProcess} <i class="fa-solid fa-loader fa-spin"></i>`)
    }

    async function handleSyncDataItem(apiEndpoint, data) {
        try {
            const res = await $.ajax({
                type: 'POST',
                url: urlapi + apiEndpoint,
                data: JSON.stringify(data),
                dataType: 'json',
                contentType: 'application/json',
            });

            // Tính % hoàn thành trên thanh tiến trình
            updateProgress();

            return res;
        } catch (err) {
            console.log(err);
        }
    }

    const delay = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
    var delayTicks = 10;

    // Xử lý dữ liệu của spendingList
    for (const spendList of dataObj.spendingList) {
        const data = {
            token: JSON.parse(localStorage.getItem('AuthToken')).token,
            namelist: spendList.namelist,
            atcreate: spendList.atcreate,
            status: spendList.status,
            lastentry: spendList.lastentry
        };
        await handleSyncDataItem('/setting/handleSyncSpendList', data);
        await delay(delayTicks); // Add a delay of 1000 milliseconds (1 second)
    }

    // Xử lý dữ liệu của spendingItem
    for (const spendItem of dataObj.spendingItem) {
        const data = {
            spendlistid: spendItem.spendlistid,
            nameitem: spendItem.nameitem,
            price: spendItem.price,
            details: spendItem.details,
            atcreate: spendItem.atcreate,
            atupdate: spendItem.atupdate,
            status: spendItem.status
        };
        await handleSyncDataItem('/setting/handleSyncSpendItem', data);
        await delay(delayTicks); // Add a delay of 1000 milliseconds (1 second)
    }

    // Nếu đồng bộ hoàn tất, hiển thị thông báo
    showSuccessToast('Đồng bộ dữ liệu hoàn tất');
    // Ẩn thanh tiến trình
    $('#syncData-Progress').addClass('d-none');
    $('#syncStatus').html('Đã đồng bộ <i class="fa-sharp fa-regular fa-circle-check"></i>');
    $('#syncStatus').removeClass('text-warning');
}


// btn đồng bộ dữ liệu
$('#btn-syncData').click(function () {
    $('#syncStatus').html('Đang đồng bộ <i class="fa-solid fa-loader fa-spin"></i>');
    $('#syncStatus').addClass('text-warning');

    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/syncData',
        success: function (res) {
            if (res.success == false && res.message == 'Không tìm thấy tệp sao lưu') {
                // Gọi hàm để sao lưu dữ liệu
                $('#btn-backupData').click();
            } else if (res.success && res.data != null) {
                handleSyncData(res.data)
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
});


// Btn sao lưu dữ liệu
$('#btn-backupData').click(function () {
    if ($('#syncDataContent').hasClass('d-none')) {
        $('#syncDataContent').removeClass('d-none');
    }

    if (!$('#btn-syncData-Login').hasClass('d-none')) {
        $('#btn-syncData-Login').addClass('d-none');
    }

    $('#syncStatus').html('Đang sao lưu <i class="fa-solid fa-loader fa-spin"></i>');
    $('#syncStatus').addClass('text-warning');

    const AuthToken = JSON.parse(localStorage.getItem('AuthToken'));

    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/backupData',
        data: {
            token: AuthToken.token
        },
        success: function (res) {
            if (res.success) {
                checkSyncStatus();

                $('#syncStatus').removeClass('text-warning');
                $('#syncStatus').html('Đã sao lưu <i class="fa-sharp fa-regular fa-circle-check"></i>');

            }
        },
        error: function (err) {
            console.log(err);
        }
    })
});


// Xử lý thông điệp nhận được từ GGDriveCallback
window.addEventListener('message', function (event) {
    const { data } = event;
    if (data && data.message === 'syncData') {
        $('#btn-syncData').click();
        checkSyncStatus();
    }
});
if (ipcRenderer != null) {
    ipcRenderer.on('GGDriveCallback', (event, res) => {
        $('#btn-syncData').click();
        checkSyncStatus();
    })
}



// Một ajax chạy lần đầu khi khởi động để kiểm tra trạng thái đồng bộ hay chưa
function checkSyncStatus() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/checkSyncStatus',
        success: function (res) {
            if (res.status) {
                $('#btn-syncData-Login').addClass('d-none'); // Ẩn nút đăng nhập GGDrive
                $('#syncDataContent').removeClass('d-none'); // Hiển thị nội dung đồng bộ
                $('#tbl_syncEmail').val(res.email); // Gán email vào thẻ input
                $('#txt_syncDate').text(res.syncDate); // Gán thời gian sao lưu vào thẻ
            } else {
                $('#btn-syncData-Login').removeClass('d-none'); // Hiển thị lại nút đăng nhập GGDrive
                $('#syncDataContent').addClass('d-none'); // Ẩn nội dung đồng bộ
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
} checkSyncStatus();

