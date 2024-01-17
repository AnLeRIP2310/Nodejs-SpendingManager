var settingsObj;
// Tải cấu hình ứng dụng và gán vào biến
function loadSettings() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/getData',
        success: function (res) {
            if (res != null) {
                settingsObj = res.desktopSetting;

                $('#st_dbPath').val(res.dbPath);

                darkModeSetting();
                defaultPageSetting();
                reminderDelete();
                tooltipSetting();
                languageSetting();
                defaultActionSetting();
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

// xử lý cài đặt darkMode
function darkModeSetting() {
    if (settingsObj.darkmode == true || settingsObj.darkmode == 'true') {
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

// xử lý cài dặt reminder
function reminderDelete() {
    if (settingsObj.reminderDelete == true || settingsObj.reminderDelete == 'true') {
        $('#st_reminder').prop('checked', true);
    } else {
        $('#st_reminder').prop('checked', false);
    }
}

// xử ly cài đặt tooltip
function tooltipSetting() {
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    if (settingsObj.tooltip == true || settingsObj.tooltip == 'true') {
        $('#st_tooltip').prop('checked', true);

        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    } else {
        $('#st_tooltip').prop('checked', false);
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
    settingsObj.darkmode = this.checked;
    editSettings('darkmode', this.checked, 'App', darkModeSetting)
});

// Sự kiện chọn trang mặt định
$('#st_defaultPage').on('change', function () {
    settingsObj.defaultPage = this.value;
    editSettings('defaultPage', this.value, 'App', defaultPageSetting)
});

// Sự kiện chọn hành động mặt định
$('#st_defaultAction').on('change', function () {
    settingsObj.defaultAction = this.value;
    editSettings('defaultAction', this.value, 'App', defaultActionSetting)
});

// Sự kiện chọn ngôn ngữ mặt định
$('#st_language').on('change', function () {
    settingsObj.language = this.value;
    editSettings('language', this.value, 'App', languageSetting)
});

// Sự kiện bật/tắt reminder
$('#st_reminder').on('change', function () {
    settingsObj.reminderDelete = this.checked;
    editSettings('reminderDelete', this.checked, 'App', reminderDelete)
})

// Sự kiện bật/tắt tooltip
$('#st_tooltip').on('change', function () {
    settingsObj.tooltip = this.checked;
    editSettings('tooltip', this.checked, 'App', tooltipSetting)
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