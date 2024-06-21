// -------------------Các chức năng đăng nhập------------------
var AppLockExists;
// Kiểm tra trạng thái đăng nhập
function checkLogin() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/auth/checkLogin',
        success: function (res) {
            if (res.data.AppLockStatus === 1) {
                $('#modalLogin').modal("show");
                $('#page-lock').find('a').html('<i class="fa-solid fa-lock-keyhole"></i>');
                $('#st_AppLock').prop('checked', true);
                $('label[for="st_AppLock"]').text("Đang bật");
            } else {
                $('#page-lock').find('a').html('<i class="fa-solid fa-lock-keyhole-open"></i>');
                $('#st_AppLock').prop('checked', false);
                $('label[for="st_AppLock"]').text("Đã tắt");
                defaultPageSetting();
            }
            AppLockExists = res.data.Exists
        },
        error: function (err) {
            console.log(err)
        }
    })
};

// Bật tắt chức năng khoá app
function toggleLockApp() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/auth/toggleLockApp',
        data: { status: $('#st_AppLock').prop('checked') ? 1 : 0 },
        success: function (res) {

        },
        error: function (err) {
            console.log(err)
        }
    });
}

// Đăng nhập
function loginApp() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/auth/Login',
        data: { password: $('#appLock_password').val() },
        success: function (res) {
            if (res.success && res.status === 200) {
                $('#modalLogin').modal("hide");
                defaultPageSetting();
                $('#page-lock').find('a').html('<i class="fa-solid fa-lock-keyhole-open"></i>');
            } else {
                $('#appLock_password').addClass('is-invalid');
                $('.appLock_error').text(res.message);
            }
        },
        error: function (err) {
            console.log(err)
        }
    });
}

// Sự kiện gọi hàm
$('#appLock_password').on('keypress', function (e) { if (e.keyCode === 13) loginApp(); });
$('#appLock_login').click(function () { loginApp() });
$('#appLock_logout').click(function () { $(ipcRenderer?.send('logout')) });
$('#appLock-register').click(function () { registerApp() });
$('#appLock-register_password, #appLock-register_comfirmPass').on('keypress', function (e) {
    $('.appLock_error').text(''); $(this).removeClass('is-invalid'); if (e.keyCode === 13) registerApp();
});
$('#appLock-OldPass, #appLock-NewPass, #appLock-ComfirmNewPass').on('keypress', function (e) {
    $('.appLock_error').text(''); $(this).removeClass('is-invalid'); if (e.keyCode === 13) changePassword();
})
$('#st_AppLock').on('change', function () {
    toggleLockApp();
    $('label[for="st_AppLock"]').text($(this).prop('checked') ? "Đang bật" : "Đã tắt");
});

// Nút khoá ứng dụng
$('#page-lock').click(function () {
    if (AppLockExists) $('#modalChangePass').modal('show')
    else $('#modalRegister').modal("show");
})

// Đăng ký
function registerApp() {
    if ($('#appLock-register_password').val() == '') {
        $('#appLock-register_password').addClass('is-invalid');
        $('.appLock_error').text('Mật khẩu không được để trống');
        return;
    };

    if ($('#appLock-register_password').val() != $('#appLock-register_comfirmPass').val()) {
        $('#appLock-register_comfirmPass').addClass('is-invalid');
        $('.appLock_error').text('Nhập lại mật không trùng');
        return;
    };

    $.ajax({
        type: 'POST',
        url: urlapi + '/auth/Register',
        data: { password: $('#appLock-register_password').val() },
        success: function (res) {
            if (res.success) {
                $('#modalRegister').modal("hide");
                showSuccessToast(res.message);
            } else {
                showErrorToast(res.message);
            }
            AppLockExists = true;
        },
        error: function (err) {
            console.log(err)
        }
    });
}

// Đổi mật khẩu
$('#appLock-changePass').click(function () {
    const data = {
        OldPass: $('#appLock-OldPass').val(),
        NewPass: $('#appLock-NewPass').val(),
        ConfirmPass: $('#appLock-ComfirmNewPass').val()
    }

    $.ajax({
        type: 'POST',
        url: urlapi + '/auth/ChangePassword',
        data: data,
        success: function (res) {
            if (res.success) {
                $('#modalChangePass').modal("hide");
                showSuccessToast(res.message);
            } else {
                $('.appLock_error').text(res.message);
                if (res?.code == 1) $('#appLock-OldPass').addClass('is-invalid')
                else if (res?.code == 2) {
                    $('#appLock-NewPass').addClass('is-invalid');
                    $('#appLock-ComfirmNewPass').addClass('is-invalid');
                }
            }
        },
        error: function (err) {
            console.log(err)
        }
    });
});

// -----------------Các chức năng cấu hình ứng dụng-------------------

var settingsObj;
// Tải cấu hình ứng dụng và gán vào biến
function loadSettings() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/getData',
        success: async function (res) {
            checkLogin();

            if (res.status) {
                settingsObj = res.data.iniObject.App;
                $('.app_version').text('Phiên bản: ' + settingsObj.version);

                darkModeSetting();
                // defaultPageSetting();
                defaultActionSetting();
                await languageSetting();
                reminderDelete();
                closeDefaultSetting();
                allowNotifySetting();
                startWithWindowSetting();
                autoUpdateSetting();
                downloadPromptSetting();
                windowPositionXSetting();
                windowPositionYSetting();
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
    if (ipcRenderer != null) {
        ipcRenderer.send('get-system-theme')
        ipcRenderer.on('reply-system-theme', (event, res) => {
            applyTheme(res ? 'dark' : 'light');
        });
    }
}

// xử lý cài đặt darkMode
function darkModeSetting() {
    if (settingsObj.darkMode == 'auto') {
        $('#st_darkMode').val(settingsObj.darkMode);
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

// Xử lý cài đặt windowPositionX
function windowPositionXSetting() {
    $('#st_windowPositionX').val(settingsObj.windowPositionX);
}

// Sự kiện chọn cài đặt windowPositionX
$('#st_windowPositionX').on('change', function () {
    settingsObj.windowPositionX = this.value;
    editSettings('windowPositionX', this.value, 'App', windowPositionXSetting)
})

// Xử lý cài đặt windowPositionY
function windowPositionYSetting() {
    $('#st_windowPositionY').val(settingsObj.windowPositionY);
}

// Sự kiện chọn cài đặt windowPositionY
$('#st_windowPositionY').on('change', function () {
    settingsObj.windowPositionY = this.value;
    editSettings('windowPositionY', this.value, 'App', windowPositionYSetting)
})

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
    $('#st_defaultAction').val(settingsObj.defaultAction);
}

// Sự kiện chọn hành động mặt định
$('#st_defaultAction').on('change', function () {
    settingsObj.defaultAction = this.value;
    editSettings('defaultAction', this.value, 'App', defaultActionSetting)
});

// xử lý cài đặt language
async function languageSetting() {
    await applyLanguage(settingsObj.language);
    $('#st_language').val(settingsObj.language);
}

// Sự kiện chọn ngôn ngữ mặt định
$('#st_language').on('change', function () {
    settingsObj.language = this.value;
    editSettings('language', this.value, 'App', languageSetting)
});

// xử lý cài dặt reminder
function reminderDelete() {
    if (settingsObj.reminderDelete || settingsObj.reminderDelete == 'true') {
        $('#st_reminder').prop('checked', true);
        $('label[for="st_reminder"]').text(langObj.settingPage.checked.on)
    } else {
        $('#st_reminder').prop('checked', false);
        $('label[for="st_reminder"]').text(langObj.settingPage.checked.off)
    }
}

// Sự kiện bật/tắt reminder
$('#st_reminder').on('change', function () {
    settingsObj.reminderDelete = this.checked;
    editSettings('reminderDelete', this.checked, 'App', reminderDelete)
})

// xử ly cài đặt tooltip
function tooltipSetting() {
    // Lấy và áp dụng popover và tooltip
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));

    if (settingsObj.tooltip || settingsObj.tooltip == 'true') {
        $('#st_tooltip').prop('checked', true);
        $('label[for="st_tooltip"]').text(langObj.settingPage.checked.on)
        // Bật popover
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
        // Bật tooltip
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    } else {
        $('#st_tooltip').prop('checked', false);
        $('label[for="st_tooltip"]').text(langObj.settingPage.checked.off)
        // Tắt popover
        popoverTriggerList.map(function (popoverTriggerEl) {
            var popover = bootstrap.Popover.getInstance(popoverTriggerEl);
            if (popover) { popover.dispose() }
        });
        // Tắt tooltip
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            var tooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
            if (tooltip) { tooltip.dispose() }
        })
    }
}

// Sự kiện bật/tắt tooltip
$('#st_tooltip').on('change', function () {
    settingsObj.tooltip = this.checked;
    editSettings('tooltip', this.checked, 'App', tooltipSetting)
});

// Xử lý cài đặt defaultClose
function closeDefaultSetting() {
    $('#st_closeDefault').val(settingsObj.closeDefault);
}

// Sự kiện chọn hành động khi thoát
$('#st_closeDefault').on('change', function () {
    settingsObj.closeDefault = this.value;
    editSettings('closeDefault', this.value, 'App', closeDefaultSetting)
});

// Xử lý cài đặt notifySpend
function allowNotifySetting() {
    if (settingsObj.notifySpend || settingsObj.notifySpend == 'true') {
        $('#st_notifySpend').prop('checked', true);
        $('label[for="st_notifySpend"]').text(langObj.settingPage.checked.on)
    } else {
        $('#st_notifySpend').prop('checked', false);
        $('label[for="st_notifySpend"]').text(langObj.settingPage.checked.off)
    }
}

// Sự kiện nhắt nhở thông báo
$('#st_notifySpend').on('change', function () {
    settingsObj.notifySpend = this.checked;
    editSettings('notifySpend', this.checked, 'App', allowNotifySetting)
});

// Xử lý cài đặt StartWithWindow
function startWithWindowSetting() {
    if (settingsObj.startWithWindow || settingsObj.startWithWindow == 'true') {
        $('#st_startWithWindow').prop('checked', true);
        $('label[for="st_startWithWindow"]').text(langObj.settingPage.checked.on)
    } else {
        $('#st_startWithWindow').prop('checked', false);
        $('label[for="st_startWithWindow"]').text(langObj.settingPage.checked.off)
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

// Xử lý cài đặt autoUpdate
function autoUpdateSetting() {
    if (settingsObj.autoUpdate || settingsObj.autoUpdate == 'true') {
        $('#st_autoUpdate').prop('checked', true);
        $('label[for="st_autoUpdate"]').text(langObj.settingPage.checked.on)
    } else {
        $('#st_autoUpdate').prop('checked', false);
        $('label[for="st_autoUpdate"]').text(langObj.settingPage.checked.off)
    }
}

// Sự kiện cài đặt autoUpdate
$('#st_autoUpdate').on('change', function () {
    settingsObj.autoUpdate = this.checked;
    editSettings('autoUpdate', this.checked, 'App', autoUpdateSetting)
})

// Xử lý cài đặt DownloadPrompt
function downloadPromptSetting() {
    if (settingsObj.downloadPrompt || settingsObj.downloadPrompt == 'true') {
        $('#st_downloadPrompt').prop('checked', true);
        $('label[for="st_downloadPrompt"]').text(langObj.settingPage.checked.on)
    } else {
        $('#st_downloadPrompt').prop('checked', false);
        $('label[for="st_downloadPrompt"]').text(langObj.settingPage.checked.off)
    }
}

// Sự kiện cài đặt DownloadPrompt
$('#st_downloadPrompt').on('change', function () {
    settingsObj.downloadPrompt = this.checked;
    editSettings('downloadPrompt', this.checked, 'App', downloadPromptSetting)

    if (this.checked) {
        $('#remember_checkUpdater').prop('checked', false);
    }
})

// Sự kiện đặt lại cài đặt mặt định
$('#btn-reset_setting').click(function () {
    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/resetData',
        success: function (res) {
            if (res.success) {
                showSuccessToast('Đặt lại cài đặt ứng dụng thành công');
                loadSettings();
                // fix lỗi element tooltip bị treo khi reset
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
    ipcRenderer.send('export-data');
});
ipcRenderer?.on('export-data-success', () => {
    showSuccessToast('Xuất dữ liệu thành công');
})

// Sự kiện nhập file db
$('#btn-import_db').click(function () {
    ipcRenderer.send('import-data');
});
ipcRenderer?.on('import-data-success', (event, data) => {
    $('#import-Progress').removeClass('d-none');
    ws.send(data);
});

// sk mở trang nguồn
$('.app_authName').click(function () {
    if (!ipcRenderer)
        window.open('https://github.com/ALR2310/SpendingManager', '_blank');
    else
        ipcRenderer.send('openUrl', 'https://github.com/ALR2310/SpendingManager')
})

// sk mở thông tin phiên bản
$('.app_version').click(function () {
    if (!ipcRenderer)
        window.open(`https://github.com/ALR2310/SpendingManager/releases/tag/v${settingsObj.version}`, '_blank');
    else
        ipcRenderer.send('openUrl', `https://github.com/ALR2310/SpendingManager/releases/tag/v${settingsObj.version}`)
})

// btn Đăng nhập vào google drive
$('#btn-syncData-Login').click(function () {
    $.get('http://localhost:3962/auth/urlPage', { urlpage: window.location.href });

    if (!ipcRenderer) {
        const width = 530, height = 600;

        const popup = window.open(
            urlapi + '/auth/loginGGDrive',
            'google-login-popup',
            `width=${width},height=${height}`
        );

        if (window.focus && popup) popup.focus();
        return false;
    } else {
        ipcRenderer.send('openUrl', urlapi + '/auth/loginGGDrive');
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

const ws = new WebSocket('ws://localhost:3963');

ws.onmessage = function (event) {
    const data = JSON.parse(event.data)
    // Thanh tiến trình đồng bộ
    $('#syncData-Progress .progress-bar').css('width', data.successProcess + '%');
    $('#syncData-Progress .progress-bar').text(data.successProcess + '%');
    $('#syncStatus').html(`${langObj.settingPage.formSyncData.status.desc4} ${data.currentProcess}/${data.totalProcess} <i class="fa-solid fa-loader fa-spin"></i>`)

    // Thanh tiến trình nhập liệu
    $('#import-Progress .progress-bar').css('width', data.successProcess + '%');
    $('#import-Progress .progress-bar').text(`${data.successProcess}% - ${data.currentProcess}/${data.totalProcess}`);

    if (data.successProcess == 100) {
        // Nếu đồng bộ hoàn tất, hiển thị thông báo
        showSuccessToast('Đồng bộ dữ liệu hoàn tất');
        // Ẩn thanh tiến trình
        $('#syncData-Progress').addClass('d-none');
        $('#import-Progress').addClass('d-none');
        $('#syncStatus').html(`${langObj.settingPage.formSyncData.status.desc3} <i class="fa-sharp fa-regular fa-circle-check"></i>`);
        $('#syncStatus').removeClass('text-warning');
    }
}


// btn đồng bộ dữ liệu
$('#btn-syncData').click(function () {
    $('#syncStatus').html(`${langObj.settingPage.formSyncData.status.desc4} <i class="fa-solid fa-loader fa-spin"></i>`);
    $('#syncStatus').addClass('text-warning');

    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/syncData',
        success: function (res) {
            if (!res.success && res.status == 404) {
                // Gọi hàm để sao lưu dữ liệu
                $('#btn-backupData').click();
            } else if (res.success && res.data != null) {
                $('#syncData-Progress').removeClass('d-none');
                ws.send(res.data);
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

    $('#syncStatus').html(`${langObj.settingPage.formSyncData.status.desc2} <i class="fa-solid fa-loader fa-spin"></i>`);
    $('#syncStatus').addClass('text-warning');

    $.ajax({
        type: 'GET',
        url: urlapi + '/setting/backupData',
        success: function (res) {
            if (res.success) {
                checkSyncStatus();
                $('#syncStatus').removeClass('text-warning');
                $('#syncStatus').html(`${langObj.settingPage.formSyncData.status.desc1} <i class="fa-sharp fa-regular fa-circle-check"></i>`);
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
});

// Xử lý thông điệp nhận được từ GGDriveCallback
window.addEventListener('message', function (event) {
    if (event.origin !== 'http://localhost:3962') return;

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
            if (res.success) {
                $('#btn-syncData-Login').addClass('d-none'); // Ẩn nút đăng nhập GGDrive
                $('#syncDataContent').removeClass('d-none'); // Hiển thị nội dung đồng bộ
                $('#tbl_syncEmail').val(res.data?.email); // Gán email vào thẻ input
                $('#txt_backupDate').text(res.data?.backupDate); // Gán thời gian sao lưu vào thẻ
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


// -------------------------- Các đoạn code liên quan đến cập nhật ứng dụng --------------------------


// nút kiểm tra và cập nhật ứng dụng
$('#btn-CheckForUpdate').click(function () {
    if (ipcRenderer != null) {
        ipcRenderer.send('check-for-update')
    }
    // Mở form xem tiến trình tải về
    $('#updateApp-content').removeClass('d-none').addClass('animate__fadeInDown')
})

// Đóng modal và gọi sự kiện tải về
$('#btnConfirmDownloadUpdate').click(function () {
    // Mở form xem tiến trình tải về
    $('#updateApp-content').removeClass('d-none').addClass('animate__fadeInDown')

    let remember_checkUpdater = $('#remember_checkUpdater').prop('checked');
    if (remember_checkUpdater) {
        settingsObj.downloadPrompt = false;
        editSettings('downloadPrompt', false, 'App', downloadPromptSetting);
    }

    if (ipcRenderer != null) {
        ipcRenderer.send('allow-download-update')
    }
})

// nhận các event liên quan đến cập nhật ứng dụng
if (ipcRenderer != null) {
    const updateStatus = $('#updateApp-Status');

    // Nhận event phát hiện bản cập nhật
    ipcRenderer.on('update-available', (event, res) => {
        const downloadPrompt = res.downloadPrompt;

        if (downloadPrompt) {
            // Hiển thị modal xác nhận tải xuống
            $('#modalConfirmDownloadUpdate').modal('show');
        } else {
            ipcRenderer.send('allow-download-update')
        }

        // hiển thị release note trên modal
        const releaseNote = res.releaseNote.replace(/\r\n/g, '<br>');
        $('#updateApp-releaseNote').html(releaseNote)

        updateStatus.css('color', 'var(--bs-info)');
        updateStatus.html(`${langObj.settingPage.formUpdate.status.desc2} <i class="fa-solid fa-sparkles fa-fade"></i>`);
    });

    // Nhận event không có bản cập nhật
    ipcRenderer.on('update-not-available', () => {
        updateStatus.css('color', 'var(--bs-success)');
        updateStatus.html(`${langObj.settingPage.formUpdate.status.desc3} <i class="fa-solid fa-circle-check"></i>`);
    })

    // Nhận event phát sinh lỗi
    ipcRenderer.on('update-error', (event, err) => {
        updateStatus.css('color', 'var(--bs-danger)');
        updateStatus.html(`${langObj.settingPage.formUpdate.status.desc4} <i class="fa-solid fa-circle-exclamation"></i>`);
        console.error(err);
    });

    // Nhận event sau khi tải về hoàn tất
    ipcRenderer.on('update-downloaded', () => {
        // Gán text vào status
        updateStatus.css('color', 'var(--bs-success)');
        updateStatus.html(`${langObj.settingPage.formUpdate.status.desc5} <i class="fa-solid fa-circle-check"></i>`);
    })

    // Nhận event tiếng trình tải về
    ipcRenderer.on('download-progress', (event, progressObj) => {
        // Gán text vào status
        updateStatus.css('color', 'var(--bs-info)');
        updateStatus.html(`${langObj.settingPage.formUpdate.status.desc6} <i class="fa-solid fa-file-arrow-down fa-fade"></i>`);

        // Gán tiến trình vào thanh tiến trình
        $('#updateApp-Progress').removeClass('d-none');
        $('#updateApp-Progress .progress-bar').css('width', progressObj.percent + '%');
        $('#updateApp-Progress .progress-bar').text(progressObj.percent + '%');

        // Hiển thị thông tin tiến trình
        $('#updateApp-info').removeClass('d-none');
        $('#updateApp-info .uApp_bytesPerSecond').text(progressObj.bytesPerSecond + '/s');
        $('#updateApp-info .uApp_transferred').text(progressObj.transferred);
        $('#updateApp-info .uApp_total').text(progressObj.total);
    });
}