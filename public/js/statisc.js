// Đóng mở panel khi click
$('#togglePanel').click(function () {
    $('.panel-content').toggleClass('panel-expanded panel-collapsed');
    // Thay đổi biểu tượng nút
    $('#togglePanel i').toggleClass('fa-chevron-up fa-chevron-down');
    // Bạn có thể thêm các hành động khác tại đây nếu cần thiết
    $(this).toggleClass('btnClearBorder');
});

// Sự kiện tuỳ chọn xem
$('#change_display-pieStatisc').on('change', function () {
    if ($(this).val() == 'date') {
        $('#panel-ctn_date').addClass('d-block');
    } else {
        $('#panel-ctn_date').removeClass('d-block');
    }

    if ($(this).val() == 'month') {
        $('#panel-ctn_month').addClass('d-block');
    } else {
        $('#panel-ctn_month').removeClass('d-block');
    }

    if ($(this).val() == 'year') {
        $('#panel-ctn_year').addClass('d-block');
    } else {
        $('#panel-ctn_year').removeClass('d-block');
    }
});


var totalPerDay;
var totalPerMonth;
var totalPerYear;

function calculateTotalMonthYear() {
    // Tính toán totalPerMonth và totalPerYear từ totalPerDay
    totalPerMonth = [];
    totalPerYear = [];

    // Tạo một đối tượng để lưu trữ tổng theo tháng và năm
    var totalsByMonth = {};
    var totalsByYear = {};

    totalPerDay.forEach(item => {
        // Tách ngày thành phần tháng và năm
        var [year, month] = item.date.split('-');

        // Tổng tiền theo tháng
        var monthKey = year + '-' + month;
        if (!totalsByMonth[monthKey]) {
            totalsByMonth[monthKey] = {
                month: month,
                year: year,
                total: 0
            };
        }
        totalsByMonth[monthKey].total += item.total;

        // Tổng tiền theo năm
        if (!totalsByYear[year]) {
            totalsByYear[year] = {
                year: year,
                total: 0
            };
        }
        totalsByYear[year].total += item.total;
    });

    // Chuyển dữ liệu từ đối tượng sang mảng
    totalPerMonth = Object.values(totalsByMonth);
    totalPerYear = Object.values(totalsByYear);

    // Gộp month và year thành một trường mới là monthYear trong totalPerMonth
    totalPerMonth.forEach(item => {
        item.monthYear = item.month + '-' + item.year;
        delete item.month;
        delete item.year;
    });
}

function drawChart_totalspending() {
    var chartDom = document.getElementById('chart-totalspending');

    // Kiểm tra xem phần tử 'chart' có tồn tại không
    if (chartDom !== null) {
        var myChart = echarts.init(chartDom);

        var xAxisData;
        var seriesData;
        var totalColumnsToShow = 13; // Số cột hiển thị

        if ($('#statisc_type').val() == 'date') {
            xAxisData = totalPerDay.map(item => item.date);
            seriesData = totalPerDay.map(item => item.total);
        } else if ($('#statisc_type').val() == 'month') {
            xAxisData = totalPerMonth.map(item => item.monthYear);
            seriesData = totalPerMonth.map(item => item.total);
        } else if ($('#statisc_type').val() == 'year') {
            xAxisData = totalPerYear.map(item => item.year);
            seriesData = totalPerYear.map(item => item.total);
        }

        var dataLength = xAxisData.length;
        var start = 0;
        var end = Math.min(start + totalColumnsToShow / dataLength, 1);

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
                start: start * 100,
                end: end * 100
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
    } else { }
}




function getTotalSpending() {
    $.ajax({
        type: 'GET',
        url: urlapi + '/statisc/getData',
        data: {
            spendList: $('#statisc_spendList').val(),
        },
        success: function (res) {
            if (res.success) {
                $('#total_today').text(formatCurrency(res.today)) // Tổng hôm nay
                $('#total_yesterday').text(formatCurrency(res.yesterday)) // Tổng hôm qua
                $('#total_thisweek').text(formatCurrency(res.thisWeek)) // Tổng tuần này
                $('#total_lastweek').text(formatCurrency(res.lastWeek)) // Tổng tuần trước

                totalPerDay = res.totalPerDay;
                drawChart_totalspending() // Gọi hàm để vẽ biểu đồ
                calculateTotalMonthYear(); // Gọi hàm tính tháng/năm
                totalPerDay = res.totalPerDay.map(item => ({
                    date: formatDate(item.date),
                    total: item.total
                }));

                // drawChart_totalperspenditem(res.totalPerSpendItem); // Gọi hàm vẽ biểu đồ

                // Tổng tiền mỗi khoản chi
                res.totalPerSpendItem.forEach((item) => {
                    item.totalprice = formatCurrency(item.totalprice);
                });
                var source = $('#template-totalPerSpendItem').html();
                var convertSource = convertPlaceHbs(source);
                var template = Handlebars.compile(convertSource);
                var data = template({ totalPerSpendItem: res.totalPerSpendItem });
                $('#tb-totalPerSpendItem').html(data);

                // Tổng các khoản chi
                $('#total_spenditem').text(res.totalSpendItem + ' khoản Chi');

                // Tổng ngày chi
                $('#total_date').text(res.totalDate + ' ngày');

                // Tổng tiền trên danh sách
                $('#total_spendlist').text(formatCurrency(res.totalPrice));

                // Lấy các năm
                source = $('#template-panel-input_year').html();
                convertSource = convertPlaceHbs(source);
                template = Handlebars.compile(convertSource);
                data = template({ yearList: res.yearList });
                $('#panel-input_year').html(data);
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
} getTotalSpending();

$('#statisc_type').on('change', function () {
    drawChart_totalspending();
})


function drawChart_totalperspenditem(data) {
    const spendItemsData = data.map(item => ({
        name: item.nameitem,
        value: item.totalprice,
    }));

    var chart = echarts.init(document.getElementById('chart-totalperspenditem'));

    var option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)',
        },
        legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 'right',
            right: 10,
            top: 20,
            bottom: 20,
            textStyle: {
                color: 'green' // Chọn màu bạn muốn ở đây
            }
        },
        series: [
            {
                name: 'Tổng tiền',
                type: 'pie',
                radius: '90%',
                data: spendItemsData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
                label: {
                    show: true,
                },
            },
        ],
    };

    // Sử dụng cấu hình để vẽ biểu đồ
    chart.setOption(option);
}

function getDataForTotalPerSpenditem() {
    var value;
    var change_display = $('#change_display-pieStatisc').val();

    if (change_display == 'date') {
        value = $('#panel-input_date').val();
    } else if (change_display == 'month') {
        value = $('#panel-input_month').val();
    } else if (change_display == 'year') {
        value = $('#panel-input_year').val();
    }

    $.ajax({
        type: 'GET',
        url: urlapi + '/statisc/getDataForChart2',
        data: {
            type: change_display,
            value: value,
            SpendListId: $('#statisc_spendList').val(),
        },
        success: function (res) {
            drawChart_totalperspenditem(res.data);
        },
        error: function (err) {
            console.log(err);
        }
    })
} getDataForTotalPerSpenditem();

$('#panel-input_date, #panel-input_month, #panel-input_year').on('change', function () {
    getDataForTotalPerSpenditem();
})