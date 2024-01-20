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
    switch (settingsObj.defaultPage) {
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
    }
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