function drawChart(data) {
    var chartDom = document.getElementById('chart');

    // Kiểm tra xem phần tử 'chart' có tồn tại không
    if (chartDom !== null) {
        var myChart = echarts.init(chartDom);

        var xAxisData = data.map(item => item.date);
        var seriesData = data.map(item => item.total);

        var option = {
            xAxis: {
                type: 'category',
                data: xAxisData,
                boundaryGap: false
            },
            yAxis: {
                type: 'value'
            },
            dataZoom: [{
                type: 'slider',
                orient: 'horizontal',
                start: 0,
                end: 4
            }],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
            },
            series: [{
                name: 'Tổng tiền',
                data: seriesData,
                type: 'bar',
                barWidth: '70%',
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
        data: {
            spendList: 1,
        },
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

                drawChart(formattedData);
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
    console.log('đã gọi btn vị trí')

    // Lấy vị trí hiện tại của người dùng
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
