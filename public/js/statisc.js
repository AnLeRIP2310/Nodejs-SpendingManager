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

// Hàm vẽ biểu đồ thống kê tổng tiền mỗi ngày/tuần/tháng/năm
function drawChart_totalPerDate() {
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

    function formatDay(value) {
        var parts = value.split('-');
        var day = parts[2];
        var month = parts[1];
        var year = parts[0];
        return `Ngày ${day} tháng ${month} năm ${year}`;
    }

    function formatWeek(value) {
        var parts = value.split('-');
        var week = parts[1];
        var year = parts[0];
        return `Tuần ${week} năm ${year}`;
    }

    function foramtMonth(value) {
        var parts = value.split('-');
        var month = parts[0];
        var year = parts[1];
        return `Tháng ${month} năm ${year}`;
    }

    $.ajax({
        type: 'GET',
        url: urlapi + '/statisc/getDataForChart1',
        data: { spendListId: $('#statisc_spendList').val() },
        success: function (res) {
            if (res.success) {
                var chartDom = document.getElementById('chart-totalspending');

                // Kiểm tra xem phần tử 'chart' có tồn tại không
                if (chartDom !== null) {
                    var myChart = echarts.init(chartDom);

                    var xAxisData;
                    var seriesData;
                    var totalColumnsToShow = 13; // Số cột hiển thị

                    // Gán dữ liệu phù hợp dựa trên tuỳ chọn
                    if ($('#statisc_type').val() == 'date') {
                        xAxisData = res.totalPerDay.map(item => item.date);
                        seriesData = res.totalPerDay.map(item => item.total);
                    } else if ($('#statisc_type').val() == 'week') {
                        xAxisData = res.totalPerWeek.map(item => item.week);
                        seriesData = res.totalPerWeek.map(item => item.total);
                    } else if ($('#statisc_type').val() == 'month') {
                        xAxisData = res.totalPerMonth.map(item => item.month);
                        seriesData = res.totalPerMonth.map(item => item.total);
                    } else if ($('#statisc_type').val() == 'year') {
                        xAxisData = res.totalPerYear.map(item => item.year);
                        seriesData = res.totalPerYear.map(item => item.total);
                    }

                    var dataLength = xAxisData.length;
                    var start = 0;
                    var end = Math.min(start + totalColumnsToShow / dataLength, 1);

                    var option = {
                        xAxis: {
                            type: 'category',
                            data: xAxisData,
                            boundaryGap: false,
                            axisLabel: {
                                formatter: function (value) {
                                    var parts = value.split('-');

                                    if ($('#statisc_type').val() == 'date') {
                                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                    } else if ($('#statisc_type').val() == 'week') {
                                        return `${parts[1]}/${parts[0]}`;
                                    } else if ($('#statisc_type').val() == 'month') {
                                        return `${parts[1]}/${parts[0]}`;
                                    } else if ($('#statisc_type').val() == 'year') {
                                        return value;
                                    }
                                }
                            }
                        },
                        yAxis: {
                            type: 'value',
                            axisLabel: { formatter: function (value) { return formatMoney(value); } }
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
                            formatter: function (params) {
                                let date = params[0].axisValueLabel;
                                let price = params[0].value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

                                if ($('#statisc_type').val() == 'date') {
                                    date = formatDay(params[0].axisValueLabel);
                                } else if ($('#statisc_type').val() == 'week') {
                                    date = formatWeek(params[0].axisValueLabel);
                                } else if ($('#statisc_type').val() == 'month') {
                                    date = foramtMonth(params[0].axisValueLabel);
                                } else if ($('#statisc_type').val() == 'year') {
                                    date = 'Năm ' + params[0].axisValueLabel;
                                }

                                return `${date}<br/><span class="tooltip-price"><strong>Tổng tiền: ${price}</strong></span>`;
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
                }
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}
// Gọi hàm lần đầu
drawChart_totalPerDate();

// Gọi hàm khi có sự thay đổi
$('#statisc_type').on('change', function () {
    drawChart_totalPerDate();
})

// Hàm lấy tổng các khoản chi và chi tiêu
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
}
// Gọi hàm lần đầu
getTotalSpending();

// Hàm vẽ biểu đồ tròn thống kê mỗi khoản chi
function drawChart_totalperspenditem(data) {
    const spendItemsData = data.map(item => ({
        name: item.nameitem,
        value: item.totalprice,
    }));

    var chart = echarts.init(document.getElementById('chart-totalperspenditem'));

    var option = {
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                return `${params.seriesName} <br/>${params.name} : ${params.value.toLocaleString()} ₫`;
            },
        },
        legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 'right',
            right: 10,
            top: 20,
            bottom: 20,
            textStyle: {
                color: 'green'
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

// Hàm lấy dữ liệu từ db cho hàm drawChart_totalperspenditem
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
}
// Gọi hàm lần đầu
getDataForTotalPerSpenditem();

// Gọi hàm khi có sự thay đổi
$('#panel-input_date, #panel-input_month, #panel-input_year').on('change', function () {
    getDataForTotalPerSpenditem();
})

// Gọi hàm tính toán khi có sự thay đổi danh sách
$('#statisc_spendList').on('change', function () {
    getTotalSpending(); // Hàm tính tổng, danh sách và các thống kê cơ bản
    drawChart_totalPerDate(); // Hàm vẽ biểu đồ cột tính tổng chi tiêu theo thời gian
    getDataForTotalPerSpenditem(); // Hàm vẽ biểu đồ tròn tính tổng từng chi tiêu
})