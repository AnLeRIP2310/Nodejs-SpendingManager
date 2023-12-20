// Load Setting App
function loadSettingApp() {
    // Kiểm tra xem đã tồn tại cấu hình cài đặt chưa
    if (localStorage.getItem('SettingApp') == null) {
        const userSetting = {
            darkMode: false,
            defalutPage: 'home',
            defaultAction: 'add',
            language: 'vi',
            reminderDelete: true,
            tooltip: true
        }
        localStorage.setItem('SettingApp', JSON.stringify(userSetting));
    }
    darkModeSetting();
    defaultPageSetting();
    defaultActionSetting();
    languageSetting();
    reminderDelete();
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

// xử lý cài dặt reminder
function reminderDelete() {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    if (SettingApp.reminderDelete) {
        $('#st_reminder').prop('checked', true);
    } else {
        $('#st_reminder').prop('checked', false);
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

// Sự kiện bật/tắt reminder
$('#st_reminder').on('change', function () {
    const SettingApp = JSON.parse(localStorage.getItem('SettingApp'));
    SettingApp.reminderDelete = this.checked;
    localStorage.setItem('SettingApp', JSON.stringify(SettingApp));
    reminderDelete();
})

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