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

$(document).ready(function() {
    init_sidebar();
    // document.getElementById('station-data-info').style.visibility = 'hidden';
});

var app2 = angular.module('app2', []);
var weatherStationDataLatest;
var weatherStationDataLatestTemp;

app2.controller('stations', function ($scope, $http) {
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

    $http.get("/data/all/stations").then(function (response) {
        if (response.status === 200) {
            weatherStationDataLatest = response.data;
            weatherStationDataLatestTemp = response.data;
            $scope.stations = weatherStationDataLatestTemp;
        }
    });

    $scope.createStation = function () {
      var name = document.getElementById('name').value;
      var lat = document.getElementById('lat').value;
      var lon = document.getElementById('lon').value;
      var email = document.getElementById('email').value;
      var phone = document.getElementById('phone').value;

      // if (!isFloat(lat) || !isFloat(lon)) {
      //     alert ("Invalid Latitude or Longitude value");
      //     return;
      // }

      var user = "Guest"; //TODO: Get the correct user

      var url = "/data/create/stations?name=" + name + "&lat=" + lat + "&lon=" + lon + "&email=" + email + "&phone=" + phone +
      "&user=" + user;
        $http.get(url).then(function (response) {
            if (response.status === 201) {
                document.getElementById('station-data-form').reset();
                var stationData = response.data;
                weatherStationDataLatest.push(stationData);
                document.getElementById('station-search').value = stationData.name;

                weatherStationDataLatestTemp = [];
                weatherStationDataLatest.forEach(function (data) {
                    var stationNameUpper = data.name.toUpperCase();
                    var queryUpper = stationData.name.toUpperCase();
                    if ((stationNameUpper).indexOf(queryUpper) !== -1) {
                        weatherStationDataLatestTemp.push(data);
                    }
                });
                $scope.stations = weatherStationDataLatestTemp;
            }
        });
    };

    function isFloat(n){
        return Number(n) === n && n % 1 !== 0;
    }
});