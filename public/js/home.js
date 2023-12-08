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
        // Xử lý nếu phần tử 'chart' không tồn tại
        // Ví dụ: Hiển thị thông báo lỗi cho người dùng hoặc thực hiện hành động thay thế khác.
    }
}


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
                drawChart(formattedData);

                // Tổng tiền mỗi khoản chi
                res.totalPerSpendItem.forEach((item) => {
                    item.totalprice = formatCurrency(item.totalprice);
                });
                var source = $('#template-totalPerSpendItem').html();
                var convertSource = convertPlaceHbs(source);
                var template = Handlebars.compile(convertSource);
                var data = template({ totalPerSpendItem: res.totalPerSpendItem });

                $('#tb-totalPerSpendItem').html(data);
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
} getTotalSpending();