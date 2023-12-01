const urlapi = 'http://localhost:3962';


// Page Home
$('#page-home').click(function () {
    fetch('templates/home.hbs')
        .then(response => response.text())
        .then(template => {
            const compiledTemplate = Handlebars.compile(template);
            const html = compiledTemplate();
            $('#page-content').html(html);
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

// Page Spendlist
$('#page-spendlist').click(function () {
    fetch('templates/spendlist.hbs')
        .then(response => response.text())
        .then(template => {
            const compiledTemplate = Handlebars.compile(template);
            const html = compiledTemplate();
            $('#page-content').html(html);
        })
        .catch(error => console.error('Error:', error));
})

// Page Statisc
$('#page-statisc').click(function () {
    fetch('templates/statisc.hbs')
        .then(response => response.text())
        .then(template => {
            const compiledTemplate = Handlebars.compile(template);
            const html = compiledTemplate();
            $('#page-content').html(html);
        })
        .catch(error => console.error('Error:', error));
})

// Page Profile
$('#page-profile').click(function () {
    fetch('templates/profile.hbs')
        .then(response => response.text())
        .then(template => {
            const compiledTemplate = Handlebars.compile(template);
            const html = compiledTemplate();
            $('#page-content').html(html);
        })
        .catch(error => console.error('Error:', error));
})

// Page Setting
$('#page-setting').click(function () {
    fetch('templates/setting.hbs')
        .then(response => response.text())
        .then(template => {
            const compiledTemplate = Handlebars.compile(template);
            const html = compiledTemplate();
            $('#page-content').html(html);
        })
        .catch(error => console.error('Error:', error));
})


// Gọi event click của page-spending làm mặt định
$('#page-spending').click();
