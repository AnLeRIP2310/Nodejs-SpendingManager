// Hàm vẽ biểu đồ
function drawChart(data) {
    function formatMoney(value) {
        if (value < 1000) {
            return value + ' ₫';
        } else if (value < 1000000) {
            return (value / 1000) + ' k';
        } else if (value < 1000000000) {
            return (value / 1000000) + ' triệu';
        } else {
            return (value / 1000000000) + ' tỷ';
        }
    }

    function formatWeek(value) {
        var parts = value.split('-');
        var weekNumber = parts[1];
        var year = parts[0];
        return weekNumber + '-' + year;
    }

    var chartDom = document.getElementById('chart');

    // Kiểm tra xem phần tử 'chart' có tồn tại không
    if (chartDom !== null) {
        var myChart = echarts.init(chartDom);

        var xAxisData;
        var seriesData;
        var totalDataToShow = 15; // Số dữ liệu hiển thị

        xAxisData = data.map(item => item.week);
        seriesData = data.map(item => item.totalprice);

        var dataLength = xAxisData.length;
        var start = 0;
        var end = Math.min(start + (totalDataToShow - 1) / (dataLength - 1), 1);

        var option = {
            xAxis: {
                type: 'category',
                data: xAxisData,
                axisLabel: { formatter: function (value) { return formatWeek(value); } }
            },
            yAxis: {
                type: 'value',
                axisLabel: { formatter: function (value) { return formatMoney(value); } }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: function (params) {
                    var week = params[0].axisValue.split('-')[1]; // Lấy số tuần từ chuỗi week
                    var year = params[0].axisValue.split('-')[0]; // Lấy năm từ chuỗi week
                    var totalprice = params[0].value;
                    return 'Tuần ' + week + ' Năm ' + year + '<br/><span class="tooltip-price"><strong>Tổng: ' + totalprice.toLocaleString() + ' đ</strong></span>';
                }
            },
            dataZoom: [{
                type: 'slider',
                start: start * 100,
                end: end * 100,
            }],
            series: [{
                type: 'line',
                data: seriesData,
                showSymbol: false,
                smooth: false,
                lineStyle: {
                    width: 5,
                    shadowColor: 'rgba(0,0,0,0.5)',
                    shadowBlur: 10,
                },
            }]
        };

        myChart.setOption(option);
    } else {
        console.log("Phần tử có ID 'chart' không tồn tại trong DOM.");
    }
}

// Hàm thống kê lấy tổng các chi tiêu
function getTotalSpending() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/home/getData',
        success: function (res) {
            if (res.success) {
                $('#total_today').text(formatCurrency(res.data.today)) // Tổng hôm nay
                $('#total_yesterday').text(formatCurrency(res.data.yesterday)) // Tổng hôm qua
                $('#total_thisweek').text(formatCurrency(res.data.thisWeek)) // Tổng tuần này
                $('#total_lastWeek').text(formatCurrency(res.data.yesterday)) // Tổng tuần trước

                drawChart(res.data.totalPerWeek);
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
}
// Gọi hàm để tính tổng
getTotalSpending();

// Hàm lấy thông tin thời tiết và gán lên giao diện
function getWeatherData(city, lang, lat, lon) {
    $.ajax({
        type: 'GET',
        url: urlapi + '/home/getWeather',
        data: { city: city, lang: lang, lat: lat, lon: lon },
        success: function (res) {
            if (res.data == null || res.data == undefined) {
                showErrorToast('Không tìm thấy thông tin thành phố')
                return
            }

            const weatherData = res.data
            $('#txt_weatherCity').text(weatherData.name);
            $('#txt_weatherDate').text(formatDate(new Date()));
            $('#txt_weatherTime').text(formatTime(new Date()));
            $('#txt_weatherTemperature').html(Math.round(weatherData.main.temp) + '&deg;C');
            $('#txt_weatherClouds').text(weatherData.weather[0] ? weatherData.weather[0].main : '');
            $('#txt_weatherCloudsDesc').text(weatherData.weather[0] ? weatherData.weather[0].description : '');
            $('#txt_weatherVisibility').text(weatherData.visibility + ' (ms)');
            $('#txt_weatherHumidity').text(weatherData.main.humidity + ' (%)');
            $('#txt_weatherWind').text(weatherData.wind.speed + ' (m/s)');

            if (weatherData.main.temp <= 18) {
                $('.weather').addClass('cold')
            } else {
                $('.weather').removeClass('cold')
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}

// Sự kiện lấy thời tiết bằng tên thành phố
$('#tbl_weatherSearch').on('keyup', function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();

        getWeatherData($(this).val().trim(), settingsObj.language)
    }
})

// Nút lấy thời tiết bằng toạ độ hiện tại
$('#btn_weatherMyAddress').click(function () {
    if (ipcRenderer != null) {
        $.ajax({
            type: 'GET',
            url: 'https://freegeoip.app/json/',
            success: function (res) { getWeatherData('',settingsObj.language, res.latitude, res.longitude) },
            error: function (err) { console.log(err) }
        })
    } else {
        navigator.geolocation.getCurrentPosition(function success(position) {
            // Gọi hàm lấy ra thông tin thời tiết
            getWeatherData('',settingsObj.language, position.coords.latitude, position.coords.longitude)
        }, function error(err) { console.log(err) });
    }
})

// Luôn gọi mặt định khi load trang
$('#btn_weatherMyAddress').click();


// btn change flip cards weather and crypto
$('#btn-flipCards').click(function () {
    $('.theCard').toggleClass('active');
})


// Ajax lấy dữ liệu cho crypto
function getCryptoData() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/home/getCryptoData',
        success: function (res) {
            var formatData = []; // Format lại dữ liệu
            for (const key in res.data) {
                if (res.data.hasOwnProperty(key)) {
                    // Thêm mỗi mục vào mảng mới
                    formatData.push(res.data[key]);
                }
            }

            formatData.forEach((item) => {
                item.date_added = formatDateTime(item.date_added)
                item.max_supply = formatCurrency(item.max_supply)
                item.total_supply = formatCurrency(item.total_supply)
                item.circulating_supply = formatCurrency(item.circulating_supply)
                item.last_updated = formatDateTime(item.last_updated)
                item.quote.VND.price = formatCurrency(item.quote.VND.price)
                item.quote.VND.volume_24h = formatCurrency(item.quote.VND.volume_24h)
                item.quote.VND.volume_change_24h = formatPercent(item.quote.VND.volume_change_24h)
                item.quote.VND.percent_change_1h = formatPercent(item.quote.VND.percent_change_1h)
                item.quote.VND.percent_change_24h = formatPercent(item.quote.VND.percent_change_24h)
                item.quote.VND.percent_change_7d = formatPercent(item.quote.VND.percent_change_7d)
                item.quote.VND.percent_change_30d = formatPercent(item.quote.VND.percent_change_30d)
                item.quote.VND.percent_change_60d = formatPercent(item.quote.VND.percent_change_60d)
                item.quote.VND.percent_change_90d = formatPercent(item.quote.VND.percent_change_90d)
                item.quote.VND.market_cap = formatCurrency(item.quote.VND.market_cap)
                item.quote.VND.fully_diluted_market_cap = formatCurrency(item.quote.VND.fully_diluted_market_cap)
                item.quote.VND.last_updated = formatDateTime(item.quote.VND.last_updated)
            });

            formatData = _.sortBy(formatData, 'cmc_rank');

            const source = convertPlaceHbs($('#template_crypto-item').html())
            const template = Handlebars.compile(source)
            const html = template({ cryptoData: formatData })
            $('.crypto').html(html)
            applyLanguage(settingsObj.language);
        },
        error: function (err) {
            console.log(err)
        }
    })
}

getCryptoData();