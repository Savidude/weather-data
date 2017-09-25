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

var startTimestamp;
var endTimestamp;
var wsid;

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
        } else if (yesterday.toDateString() === startDate.toDateString()) {
            yesterday.setHours(8);
            startTimestamp = yesterday.getTime();

            today.setHours(8);
            endTimestamp = today.getTime();
        } else {
            startTimestamp = picker.startDate;
            endTimestamp = picker.endDate;
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

var weatherDataArray;
var stationName;
$(document).ready(function() {
    wsid = document.getElementById('station-id').value;

    init_sidebar();
    init_daterangepicker();
    initTimeRange(new Date());

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

var app3 = angular.module('app3', []);

app3.controller('stations', function ($scope, $http) {
    var wsid = document.getElementById('station-id').value;
    var url = "/data/station/" + wsid;
    $http.get(url).then(function (response) {
        if (response.status === 200) {
            stationName = response.data.name;
            document.getElementById('station-name').innerHTML = stationName + " Weather Data";
        }
    });
});

function plotWeatherData(weatherData) {
    weatherDataArray = weatherData;
    var tableBody = document.getElementById('weatherData');
    tableBody.innerHTML = '';
    weatherData.forEach (function (data) {
        var row = document.createElement('tr');

        var updatedDate = new Date(data.recDateTime);
        var dateTime = updatedDate.getDate() + "/"
            + (updatedDate.getMonth()+1)  + "/"
            + updatedDate.getFullYear() + " "
            + updatedDate.getHours() + ":"
            + (updatedDate.getMinutes() < 10 ? '0' + updatedDate.getMinutes() : updatedDate.getMinutes()) + ":"
            + (updatedDate.getSeconds() < 10 ? '0' + updatedDate.getSeconds() : updatedDate.getSeconds());

        var timeData = document.createElement('td');
        timeData.innerHTML = dateTime;
        row.appendChild(timeData);

        var rainfallData = document.createElement('td');
        rainfallData.innerHTML = data.rainfall;
        row.appendChild(rainfallData);

        var tempData = document.createElement('td');
        tempData.innerHTML = data.temp;
        row.appendChild(tempData);

        var humidityData = document.createElement('td');
        humidityData.innerHTML = data.humidity;
        row.appendChild(humidityData);

        var windspdData = document.createElement('td');
        windspdData.innerHTML = data.windspd;
        row.appendChild(windspdData);

        var winddirData = document.createElement('td');
        winddirData.innerHTML = data.winddir;
        row.appendChild(winddirData);

        tableBody.appendChild(row);
    });
}

function downloadCSV() {
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "/data/download",
        data: JSON.stringify(weatherDataArray),
        success: function (result) {
            console.log(JSON.stringify(result));
            window.location = '/data/download?filename=' + stationName;
        }
    });
}