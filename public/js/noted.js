$('.btn-noted-toggle-action').click(function () {
    var dataId = $(this).data('id');
    var notedContentAction = $('.list-group-item[data-id="' + dataId + '"] .noted-content_action');

    if ($(this).html().includes('<i class="fa-solid fa-angle-left"></i>')) {
        $(this).html('<i class="fa-solid fa-angle-right"></i>');
        notedContentAction.css('animation', 'slide-right-show 0.5s ease forwards');
        notedContentAction.css('display', 'flex');
    } else {
        $(this).html('<i class="fa-solid fa-angle-left"></i>');
        notedContentAction.css('animation', 'slide-right-hidden 0.5s ease forwards');
        setTimeout(() => {
            notedContentAction.css('display', 'none');
        }, 200);
    }
});


const inputGroupNotedSearch = $('#input-group-notedSearch')
const inputGroupNotedAdd = $('#input-group-notedAdd')
const txtNotedSearch = $('#txt-notedSearch')
const btnNotedSearch = $('#btn-notedSearch')
const txtNotedAdd = $('#txt-notedAdd')
const btnNotedAdd = $('#btn-notedAdd')
var isFormNotedOpen = 0;

// Nút mở đóng form thêm dữ liệu
btnNotedAdd.click(function () {
    if (isFormNotedOpen == 0) {
        inputGroupNotedSearch.removeClass('w-auto');
        inputGroupNotedSearch.css('width', '38.674px');

        setTimeout(() => {
            txtNotedSearch.addClass('d-none');
            btnNotedSearch.addClass('border-top-bottom-left-radius')
        }, 250);


        inputGroupNotedAdd.removeClass('w-auto');
        inputGroupNotedAdd.css('width', '218.491px');

        txtNotedAdd.removeClass('d-none');
        $(this).removeClass('border-top-bottom-left-radius')
        isFormNotedOpen = 1;
    }
});

// Nút mở đóng form tìm kiếm
btnNotedSearch.click(function () {
    if (isFormNotedOpen == 1) {
        inputGroupNotedAdd.css('width', '38.674px');
        inputGroupNotedSearch.css('width', '218.491px');

        setTimeout(() => {
            txtNotedAdd.addClass('d-none');
            txtNotedSearch.removeClass('d-none');
            btnNotedAdd.addClass('border-top-bottom-left-radius')
            $(this).removeClass('border-top-bottom-left-radius')
            inputGroupNotedAdd.addClass('w-auto')
        }, 280);

        isFormNotedOpen = 0;
    }
});



