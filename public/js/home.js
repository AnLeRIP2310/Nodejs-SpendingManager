// Hàm vẽ biểu đồ
function drawChart(data) {
    function formatMoney(value) {
        if (value < 1000) {
            return value + ' k';
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
                lineStyle: {
                    width: 2,
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
                $('#total_today').text(formatCurrency(res.today)) // Tổng hôm nay
                $('#total_yesterday').text(formatCurrency(res.yesterday)) // Tổng hôm qua
                $('#total_thisweek').text(formatCurrency(res.thisWeek)) // Tổng tuần này
                $('#total_lastweek').text(formatCurrency(res.lastWeek)) // Tổng tuần trước

                // Tổng tiền mỗi ngày
                const formattedData = res.totalPerDay.map(item => ({
                    date: formatDate(item.date),
                    total: item.total
                }));

                drawChart(res.totalPerWeek);
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
function getWeatherData(city, lat, lon) {
    $.ajax({
        type: 'GET',
        url: urlapi + '/home/getWeather',
        data: { city: city, lat: lat, lon: lon },
        success: function (res) {
            if (res.data == null || res.data == undefined) {
                showErrorToast('Không tìm thấy thông tin thành phố')
                return
            }

            const weatherData = res.data
            $('#txt_weatherCity').text(weatherData.name);
            $('#txt_weatherCountry').text(weatherData.sys.country);
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

        getWeatherData($(this).val().trim())
    }
})

// Nút lấy thời tiết bằng toạ độ hiện tại
$('#btn_weatherMyAddress').click(function () {
    navigator.geolocation.getCurrentPosition(
        function success(position) {
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;

            // Gọi hàm lấy ra thông tin thời tiết
            getWeatherData('', lat, lon)
        },
        function error() {
            console.log('Không thể truy xuất vị trí của bạn')
        });
})

// Luôn gọi mặt định khi load trang
$('#btn_weatherMyAddress').click(); 
