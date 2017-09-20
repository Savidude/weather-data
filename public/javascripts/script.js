/**
 * Resize function without multiple trigger
 *
 * Usage:
 * $(window).smartresize(function(){
 *     // code here
 * });
 */
(function($,sr){
    // debouncing function from John Hann
    // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
    var debounce = function (func, threshold, execAsap) {
        var timeout;

        return function debounced () {
            var obj = this, args = arguments;
            function delayed () {
                if (!execAsap)
                    func.apply(obj, args);
                timeout = null;
            }

            if (timeout)
                clearTimeout(timeout);
            else if (execAsap)
                func.apply(obj, args);

            timeout = setTimeout(delayed, threshold || 100);
        };
    };

    // smartresize
    jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

})(jQuery,'smartresize');
/**
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var CURRENT_URL = window.location.href.split('#')[0].split('?')[0],
    $BODY = $('body'),
    $MENU_TOGGLE = $('#menu_toggle'),
    $SIDEBAR_MENU = $('#sidebar-menu'),
    $SIDEBAR_FOOTER = $('.sidebar-footer'),
    $LEFT_COL = $('.left_col'),
    $RIGHT_COL = $('.right_col'),
    $NAV_MENU = $('.nav_menu'),
    $FOOTER = $('footer');

// Sidebar
function init_sidebar() {
// TODO: This is some kind of easy fix, maybe we can improve this
    var setContentHeight = function () {
        // reset height
        $RIGHT_COL.css('min-height', $(window).height());

        var bodyHeight = $BODY.outerHeight(),
            footerHeight = $BODY.hasClass('footer_fixed') ? -10 : $FOOTER.height(),
            leftColHeight = $LEFT_COL.eq(1).height() + $SIDEBAR_FOOTER.height(),
            contentHeight = bodyHeight < leftColHeight ? leftColHeight : bodyHeight;

        // normalize content
        contentHeight -= $NAV_MENU.height() + footerHeight;

        $RIGHT_COL.css('min-height', contentHeight);
    };

    $SIDEBAR_MENU.find('a').on('click', function(ev) {
        console.log('clicked - sidebar_menu');
        var $li = $(this).parent();

        if ($li.is('.active')) {
            $li.removeClass('active active-sm');
            $('ul:first', $li).slideUp(function() {
                setContentHeight();
            });
        } else {
            // prevent closing menu if we are on child menu
            if (!$li.parent().is('.child_menu')) {
                $SIDEBAR_MENU.find('li').removeClass('active active-sm');
                $SIDEBAR_MENU.find('li ul').slideUp();
            }else
            {
                if ( $BODY.is( ".nav-sm" ) )
                {
                    $SIDEBAR_MENU.find( "li" ).removeClass( "active active-sm" );
                    $SIDEBAR_MENU.find( "li ul" ).slideUp();
                }
            }
            $li.addClass('active');

            $('ul:first', $li).slideDown(function() {
                setContentHeight();
            });
        }
    });

// toggle small or large menu
    $MENU_TOGGLE.on('click', function() {
        console.log('clicked - menu toggle');

        if ($BODY.hasClass('nav-md')) {
            $SIDEBAR_MENU.find('li.active ul').hide();
            $SIDEBAR_MENU.find('li.active').addClass('active-sm').removeClass('active');
        } else {
            $SIDEBAR_MENU.find('li.active-sm ul').show();
            $SIDEBAR_MENU.find('li.active-sm').addClass('active').removeClass('active-sm');
        }

        $BODY.toggleClass('nav-md nav-sm');

        setContentHeight();
    });

    // check active menu
    $SIDEBAR_MENU.find('a[href="' + CURRENT_URL + '"]').parent('li').addClass('current-page');

    $SIDEBAR_MENU.find('a').filter(function () {
        return this.href == CURRENT_URL;
    }).parent('li').addClass('current-page').parents('ul').slideDown(function() {
        setContentHeight();
    }).parent().addClass('active');

    // recompute content when resizing
    $(window).smartresize(function(){
        setContentHeight();
    });

    setContentHeight();

    // fixed sidebar
    if ($.fn.mCustomScrollbar) {
        $('.menu_fixed').mCustomScrollbar({
            autoHideScrollbar: true,
            theme: 'minimal',
            mouseWheel:{ preventDefault: true }
        });
    }
};
// /Sidebar


// Panel toolbox
$(document).ready(function() {
    $('.collapse-link').on('click', function() {
        var $BOX_PANEL = $(this).closest('.x_panel'),
            $ICON = $(this).find('i'),
            $BOX_CONTENT = $BOX_PANEL.find('.x_content');

        // fix for some div with hardcoded fix class
        if ($BOX_PANEL.attr('style')) {
            $BOX_CONTENT.slideToggle(200, function(){
                $BOX_PANEL.removeAttr('style');
            });
        } else {
            $BOX_CONTENT.slideToggle(200);
            $BOX_PANEL.css('height', 'auto');
        }

        $ICON.toggleClass('fa-chevron-up fa-chevron-down');
    });

    $('.close-link').click(function () {
        var $BOX_PANEL = $(this).closest('.x_panel');

        $BOX_PANEL.remove();
    });
});
// /Panel toolbox

// Tooltip
$(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip({
        container: 'body'
    });
});
// /Tooltip

// Progressbar
if ($(".progress .progress-bar")[0]) {
    $('.progress .progress-bar').progressbar();
}
// /Progressbar

// Switchery
$(document).ready(function() {
    if ($(".js-switch")[0]) {
        var elems = Array.prototype.slice.call(document.querySelectorAll('.js-switch'));
        elems.forEach(function (html) {
            var switchery = new Switchery(html, {
                color: '#26B99A'
            });
        });
    }
});
// /Switchery


// iCheck
$(document).ready(function() {
    if ($("input.flat")[0]) {
        $(document).ready(function () {
            $('input.flat').iCheck({
                checkboxClass: 'icheckbox_flat-green',
                radioClass: 'iradio_flat-green'
            });
        });
    }
});
// /iCheck

// Table
$('table input').on('ifChecked', function () {
    checkState = '';
    $(this).parent().parent().parent().addClass('selected');
    countChecked();
});
$('table input').on('ifUnchecked', function () {
    checkState = '';
    $(this).parent().parent().parent().removeClass('selected');
    countChecked();
});

var checkState = '';

$('.bulk_action input').on('ifChecked', function () {
    checkState = '';
    $(this).parent().parent().parent().addClass('selected');
    countChecked();
});
$('.bulk_action input').on('ifUnchecked', function () {
    checkState = '';
    $(this).parent().parent().parent().removeClass('selected');
    countChecked();
});
$('.bulk_action input#check-all').on('ifChecked', function () {
    checkState = 'all';
    countChecked();
});
$('.bulk_action input#check-all').on('ifUnchecked', function () {
    checkState = 'none';
    countChecked();
});

function countChecked() {
    if (checkState === 'all') {
        $(".bulk_action input[name='table_records']").iCheck('check');
    }
    if (checkState === 'none') {
        $(".bulk_action input[name='table_records']").iCheck('uncheck');
    }

    var checkCount = $(".bulk_action input[name='table_records']:checked").length;

    if (checkCount) {
        $('.column-title').hide();
        $('.bulk-actions').show();
        $('.action-cnt').html(checkCount + ' Records Selected');
    } else {
        $('.column-title').show();
        $('.bulk-actions').hide();
    }
}

// Accordion
$(document).ready(function() {
    $(".expand").on("click", function () {
        $(this).next().slideToggle(200);
        $expand = $(this).find(">:first-child");

        if ($expand.text() == "+") {
            $expand.text("-");
        } else {
            $expand.text("+");
        }
    });
});

//hover and retain popover when on popover content
var originalLeave = $.fn.popover.Constructor.prototype.leave;
$.fn.popover.Constructor.prototype.leave = function(obj) {
    var self = obj instanceof this.constructor ?
        obj : $(obj.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type);
    var container, timeout;

    originalLeave.call(this, obj);

    if (obj.currentTarget) {
        container = $(obj.currentTarget).siblings('.popover');
        timeout = self.timeout;
        container.one('mouseenter', function() {
            //We entered the actual popover – call off the dogs
            clearTimeout(timeout);
            //Let's monitor popover content instead
            container.one('mouseleave', function() {
                $.fn.popover.Constructor.prototype.leave.call(self, self);
            });
        });
    }
};

$('body').popover({
    selector: '[data-popover]',
    trigger: 'click hover',
    delay: {
        show: 50,
        hide: 400
    }
});

function gd(year, month, day) {
    return new Date(year, month - 1, day).getTime();
}

var tempPlotData = [];
var humidityPlotData = [];
var windspdPlotData = [];
var winddirPlotData = [];
var plotSettings;
var wsid;

function init_flot_chart(){

    if( typeof ($.plot) === 'undefined'){ return; }

    plotSettings = {
        grid: {
            show: true,
            aboveData: true,
            color: "#3f3f3f",
            labelMargin: 10,
            axisMargin: 0,
            borderWidth: 0,
            borderColor: null,
            minBorderMargin: 5,
            clickable: true,
            hoverable: true,
            autoHighlight: true,
            mouseActiveRadius: 100
        },
        series: {
            lines: {
                show: true,
                fill: true,
                lineWidth: 2,
                steps: false
            },
            points: {
                show: true,
                radius: 4.5,
                symbol: "circle",
                lineWidth: 3.0
            }
        },
        legend: {
            position: "ne",
            margin: [0, -25],
            noColumns: 0,
            labelBoxBorderColor: null,
            labelFormatter: function (label, series) {
                return label + '&nbsp;&nbsp;';
            },
            width: 40,
            height: 1
        },
        colors: ['#96CA59', '#3F97EB', '#72c380', '#6f7a8a', '#f7cb38', '#5a8022', '#2c7282'],
        shadowSize: 0,
        tooltip: true,
        tooltipOpts: {
            content: "%s: %y.0",
            xDateFormat: "%d/%m",
            shifts: {
                x: -30,
                y: -50
            },
            defaultTheme: false
        },
        yaxis: {
            min: 0
        },
        xaxis: {
            mode: "time",
            timeformat: "%I:%M %p"
        }
    };


    // var chart_plot_02_data = [];
    //
    // for (var i = 0; i < 30; i++) {
    //     chart_plot_02_data.push([new Date(Date.today().add(i).days()).getTime(), randNum() + i + i + 10]);
    // }
    //
    // var chart_plot_02_settings = {
    //     grid: {
    //         show: true,
    //         aboveData: true,
    //         color: "#3f3f3f",
    //         labelMargin: 10,
    //         axisMargin: 0,
    //         borderWidth: 0,
    //         borderColor: null,
    //         minBorderMargin: 5,
    //         clickable: true,
    //         hoverable: true,
    //         autoHighlight: true,
    //         mouseActiveRadius: 100
    //     },
    //     series: {
    //         lines: {
    //             show: true,
    //             fill: true,
    //             lineWidth: 2,
    //             steps: false
    //         },
    //         points: {
    //             show: true,
    //             radius: 4.5,
    //             symbol: "circle",
    //             lineWidth: 3.0
    //         }
    //     },
    //     legend: {
    //         position: "ne",
    //         margin: [0, -25],
    //         noColumns: 0,
    //         labelBoxBorderColor: null,
    //         labelFormatter: function(label, series) {
    //             return label + '&nbsp;&nbsp;';
    //         },
    //         width: 40,
    //         height: 1
    //     },
    //     colors: ['#96CA59', '#3F97EB', '#72c380', '#6f7a8a', '#f7cb38', '#5a8022', '#2c7282'],
    //     shadowSize: 0,
    //     tooltip: true,
    //     tooltipOpts: {
    //         content: "%s: %y.0",
    //         xDateFormat: "%d/%m",
    //         shifts: {
    //             x: -30,
    //             y: -50
    //         },
    //         defaultTheme: false
    //     },
    //     yaxis: {
    //         min: 0
    //     },
    //     xaxis: {
    //         mode: "time",
    //         timeformat: "%y/%m/%d"
    //     }
    // };
    //
    // if ($("#chart_plot_02").length){
    //     console.log(JSON.stringify(chart_plot_02_data, null, 2));
    //     $.plot( $("#chart_plot_02"),
    //         [{
    //             label: "Something",
    //             data: chart_plot_02_data,
    //             lines: {
    //                 fillColor: "rgba(150, 202, 89, 0.12)"
    //             },
    //             points: {
    //                 fillColor: "#fff" }
    //         }], chart_plot_02_settings);
    //
    // }

}

/* AUTOSIZE */

function init_autosize() {

    if(typeof $.fn.autosize !== 'undefined'){

        autosize($('.resizable_textarea'));

    }

};

/* DATERANGEPICKER */

var startTimestamp = moment();
var endTimestamp = moment().add(1, 'days');

function init_daterangepicker() {

    if( typeof ($.fn.daterangepicker) === 'undefined'){ return; }
    console.log('init_daterangepicker');

    var cb = function(start, end, label) {
        console.log(start.toISOString(), end.toISOString(), label);
        $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
    };

    var optionSet1 = {
        startDate: moment(),
        endDate: moment().add(1, 'days'),
        minDate: '01/01/2012',
        maxDate: '12/31/2017',
        dateLimit: {
            days: 60
        },
        showDropdowns: true,
        showWeekNumbers: true,
        timePicker: false,
        timePickerIncrement: 1,
        timePicker12Hour: true,
        ranges: {
            'Today': [moment(), moment().add(1, 'days')],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        opens: 'left',
        buttonClasses: ['btn btn-default'],
        applyClass: 'btn-small btn-primary',
        cancelClass: 'btn-small',
        format: 'MM/DD/YYYY',
        separator: ' to ',
        locale: {
            applyLabel: 'Submit',
            cancelLabel: 'Clear',
            fromLabel: 'From',
            toLabel: 'To',
            customRangeLabel: 'Custom',
            daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            firstDay: 1
        }
    };

    $('#reportrange span').html(moment().format('MMMM D, YYYY') + ' - ' + moment().add(1, 'days').format('MMMM D, YYYY'));
    $('#reportrange').daterangepicker(optionSet1, cb);
    $('#reportrange').on('show.daterangepicker', function() {
        console.log("show event fired");
    });
    $('#reportrange').on('hide.daterangepicker', function() {
        console.log("hide event fired");
    });
    $('#reportrange').on('apply.daterangepicker', function(ev, picker) {
        console.log("apply event fired, start/end dates are " + picker.startDate + " to " + picker.endDate);
        var today = new Date();
        var yesterday = new Date();
        yesterday.setDate(today.getDate() -1);
        var startDate = new Date (picker.startDate);
        if (today.toDateString() === startDate.toDateString()) {
            initTimeRange(today);
            plotSettings.xaxis.timeformat = "%I:%M %p";
        } else if (yesterday.toDateString() === startDate.toDateString()) {
            yesterday.setHours(8);
            startTimestamp = yesterday.getTime();

            today.setHours(8);
            endTimestamp = today.getTime();

            plotSettings.xaxis.timeformat = "%I:%M %p";
        } else {
            startTimestamp = picker.startDate;
            endTimestamp = picker.endDate;

            plotSettings.xaxis.timeformat = "%y/%m/%d";
        }

        $.ajax({
            url: "/data/stations/" + wsid + "?start=" + startTimestamp + "&end=" + endTimestamp,
            type: 'GET',
            contentType: 'application/json',
            success: function (result) {
                plotWeatherData(result);
            },
            error: function (error) {
                console.log(JSON.stringify(error, null, 2));
            }
        });
    });
    $('#reportrange').on('cancel.daterangepicker', function(ev, picker) {
        console.log("cancel event fired");
    });
    $('#options1').click(function() {
        $('#reportrange').data('daterangepicker').setOptions(optionSet1, cb);
    });

}

function initTimeRange(today) {
    //Checking if it is before 8 a.m.
    if (today.getHours() < 8) {
        var yesterday = new Date();
        yesterday.setDate(today.getDate() -1);
        yesterday.setHours(8);
        startTimestamp = yesterday.getTime();

        today.setHours(8);
        endTimestamp = today.getTime();
    } else {
        today.setHours(8);
        startTimestamp = today.getTime();

        var tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(8);
        endTimestamp = tomorrow.getTime();
    }
}

$(document).ready(function() {
    init_flot_chart();
    init_sidebar();
    init_daterangepicker();
    init_autosize();
    initTimeRange(new Date());

    document.getElementById('data-plot').style.visibility = 'hidden';
});

var app1 = angular.module('app1', []);
var weatherStationDataLatest;
var weatherStationDataLatestTemp;

//Get the GPS Coordinates of weather stations and display on map
app1.controller('stations', function ($scope, $http) {
    $scope.stations = null;

    $scope.query = '';
    $scope.locationSearch = function (keyEvent) {
        if ($scope.query === '') {
            $scope.stations = weatherStationDataLatest;
        } else {
            weatherStationDataLatestTemp = [];
            weatherStationDataLatest.forEach(function (data) {
                var stationNameUpper = data.name.toUpperCase();
                var queryUpper = $scope.query.toUpperCase();
                if ((stationNameUpper).indexOf(queryUpper) !== -1) {
                    weatherStationDataLatestTemp.push(data);
                }
            });
            $scope.stations = weatherStationDataLatestTemp;
        }
    };

    $http.get("/data/stations").then(function (response) {
        if (response.status === 200) {
            weatherStationDataLatest = response.data;
            weatherStationDataLatestTemp = response.data;
            $scope.stations = weatherStationDataLatestTemp;

            google.charts.load("current", {
                "packages":["map"],
                "mapsApiKey": "AIzaSyDof3ukKWJJlFrHqh5sJlPHPusUQ4lOwaU"
            });
            google.charts.setOnLoadCallback(drawChart);
            function drawChart() {
                var stationDataArray = [['Lat', 'Lon', 'Name']];
                weatherStationDataLatest.forEach (function (station) {
                    var stationData = [station.lat, station.lon, getWeatherDataInfoWindow(station).outerHTML];
                    stationDataArray.push(stationData);
                });

                var data = google.visualization.arrayToDataTable(stationDataArray);
                var map = new google.visualization.Map(document.getElementById('map_div'));
                map.draw(data, {
                    showTooltip: false,
                    showInfoWindow: true,
                    useMapTypeControl: true
                });
            }
        }
    });

    function getWeatherDataInfoWindow(station) {
        var stationInfoWindow = document.createElement('div');
        stationInfoWindow.className = 'station-info';

        var name = document.createElement('h3');
        name.innerHTML = '<i class="fa fa-map-marker" aria-hidden="true"></i> ' + station.name;
        stationInfoWindow.appendChild(name);

        var coordinates = document.createElement('div');
        var coordinatesTable = document.createElement('table');
        var latitude = document.createElement('td');
        latitude.innerHTML = 'Lat: ' + station.lat;
        coordinatesTable.appendChild(latitude);
        var longitude = document.createElement('td');
        longitude.innerHTML = 'Lon: ' + station.lon;
        coordinatesTable.appendChild(longitude);
        coordinates.appendChild(coordinatesTable);
        stationInfoWindow.appendChild(coordinates);

        var temperature = document.createElement('h1');
        temperature.innerHTML = station.temp + ' <sup>o</sup>C';
        stationInfoWindow.appendChild(temperature);

        var weatherData = document.createElement('table');
        var row1 = document.createElement('tr');
        var humidity = document.createElement('td');
        humidity.innerHTML = 'Humidity: ' + station.humidity + '%';
        row1.appendChild(humidity);
        var rainfall = document.createElement('td');
        rainfall.innerHTML = 'Rainfall: ' + station.rainfall + 'mm';
        row1.appendChild(rainfall);
        weatherData.appendChild(row1);
        var row2 = document.createElement('tr');
        var windspd = document.createElement('td');
        windspd.innerHTML = 'Wind Speed: ' + station.windspd + 'km/h';
        row2.appendChild(windspd);
        var winddir = document.createElement('td');
        winddir.innerHTML = 'Wind Direction: ' + station.winddir;
        row2.appendChild(winddir);
        weatherData.appendChild(row2);
        stationInfoWindow.appendChild(weatherData);

        return stationInfoWindow;
    }

    $scope.stationDataRequest = function (id, name) {
        var url = "/data/stations/" + id + "?start=" + startTimestamp + "&end=" + endTimestamp;
        wsid = id;
        $http.get(url).then(function (response) {
            if (response.status === 200) {
                document.getElementById('data-plot').style.visibility = 'visible';
                var weatherData = response.data;
                document.getElementById('weather-data-title').innerHTML = name + " Weather Data";
                plotWeatherData(weatherData);
            }
        });
    };
});

function plotWeatherData(weatherData) {
    tempPlotData = [];
    humidityPlotData = [];
    windspdPlotData = [];
    winddirPlotData = [];
    weatherData.forEach (function (data) {
        tempPlotData.push([data.recDateTime, data.temp]);
        humidityPlotData.push([data.recDateTime, data.humidity]);
        windspdPlotData.push([data.recDateTime, data.windspd]);
        winddirPlotData.push([data.recDateTime, data.winddir]);
    });
    console.log(JSON.stringify(tempPlotData, null, 2));

    if (weatherData.length > 0) {
        plotSettings.xaxis.min = weatherData[0].recDateTime;
        plotSettings.xaxis.max = weatherData[weatherData.length - 1].recDateTime;
    }

    if( typeof ($.plot) !== 'undefined') {
        if ($("#temp_plot").length){
            $.plot( $("#temp_plot"),
                [{
                    label: "Temperature",
                    data: tempPlotData,
                    lines: {
                        fillColor: "rgba(150, 202, 89, 0.12)"
                    },
                    points: {
                        fillColor: "#fff" }
                }], plotSettings);

        }

        if ($("#humidity_plot").length){
            $.plot( $("#humidity_plot"),
                [{
                    label: "Humidity",
                    data: humidityPlotData,
                    lines: {
                        fillColor: "rgba(150, 202, 89, 0.12)"
                    },
                    points: {
                        fillColor: "#fff" }
                }], plotSettings);

        }

        if ($("#windspd_plot").length){
            $.plot( $("#windspd_plot"),
                [{
                    label: "Wind Speed",
                    data: windspdPlotData,
                    lines: {
                        fillColor: "rgba(150, 202, 89, 0.12)"
                    },
                    points: {
                        fillColor: "#fff" }
                }], plotSettings);

        }

        if ($("#winddir_plot").length){
            $.plot( $("#winddir_plot"),
                [{
                    label: "Wind Direction",
                    data: winddirPlotData,
                    lines: {
                        fillColor: "rgba(150, 202, 89, 0.12)"
                    },
                    points: {
                        fillColor: "#fff" }
                }], plotSettings);

        }
    }
}