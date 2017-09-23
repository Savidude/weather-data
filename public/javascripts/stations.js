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
      var sim = document.getElementById('sim').value;

      // if (!isFloat(lat) || !isFloat(lon)) {
      //     alert ("Invalid Latitude or Longitude value");
      //     return;
      // }

      var user = "Guest"; //TODO: Get the correct user

      var url = "/data/create/stations?name=" + name + "&lat=" + lat + "&lon=" + lon + "&email=" + email + "&phone=" + phone +
      "&sim=" + sim + "&user=" + user;
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

    $scope.editStation = function (station) {
        var modal =
            '<div class="modal fade" role="dialog" id="editStationModal">' +
                '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<button type="button" class="close" data-dismiss="modal">x</button>' +
                            '<h4 class="modal-title">Edit Station</h4>' +
                        '</div>' +
                        '<div class="modal-body">' +
                            '<form id="station-data-form2">' +
                                '<div class="form-group">' +
                                    '<label for="name">Name:</label>' +
                                    '<input type="text" class="form-control" id="edit-name" value=' + station.name +'>' +
                                '</div>' +
                                '<div class="form-group">' +
                                    '<label for="name">Latitude:</label>' +
                                    '<input type="text" class="form-control" id="edit-lat" value=' + station.lat +'>' +
                                '</div>' +
                                '<div class="form-group">' +
                                    '<label for="name">Longitude:</label>' +
                                    '<input type="text" class="form-control" id="edit-lon" value=' + station.lon +'>' +
                                '</div>' +
                                '<div class="form-group">' +
                                    '<label for="name">Notify Email:</label>' +
                                    '<input type="text" class="form-control" id="edit-email" value=' + station.notify_email +'>' +
                                '</div>' +
                                '<div class="form-group">' +
                                    '<label for="name">Notify Phone:</label>' +
                                    '<input type="text" class="form-control" id="edit-phone" value=' + station.notify_phone +'>' +
                                '</div>' +
                                '<div class="form-group">' +
                                    '<label for="name">SIM Number:</label>' +
                                    '<input type="text" class="form-control" id="edit-sim" value=' + station.sim +'>' +
                                '</div>' +
                            '</form>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
                            '<button type="button" class="btn btn-success" data-dismiss="modal" ' +
                                'onclick="editStationData(\'' + station.id + '\')">Save Changes</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        var modal_div = document.createElement('div');
        modal_div.innerHTML = modal;
        var weather_station_data_div = document.getElementById('weather-station-data');
        weather_station_data_div.appendChild(modal_div);

        $('#editStationModal').modal('show');
        $("#editStationModal").on("hidden.bs.modal", function () {
            modal_div.remove();
        });
    };

    $scope.deleteStation = function (station) {
        var modal =
            '<div class="modal fade" role="dialog" id="deleteStationModal">' +
                '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<button type="button" class="close" data-dismiss="modal">x</button>' +
                            '<h4 class="modal-title">Delete ' + station.name + '?</h4>' +
                        '</div>' +
                    '<div class="modal-body">' +
                        '<p>Are you sure you want to delete this weather station?</p>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>' +
                        '<button type="button" class="btn btn-danger" data-dismiss="modal" ' +
                        'onclick="deleteStation(\'' + station.id + '\', \''+ station.key + '\')">Delete</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        var modal_div = document.createElement('div');
        modal_div.innerHTML = modal;
        var weather_station_data_div = document.getElementById('weather-station-data');
        weather_station_data_div.appendChild(modal_div);

        $('#deleteStationModal').modal('show');
        $("#deleteStationModal").on("hidden.bs.modal", function () {
            modal_div.remove();
        });
    };

    function isFloat(n){
        return Number(n) === n && n % 1 !== 0;
    }

    $scope.go = function ( path ) {
        console.log(path)
        window.location = path
    };
});

function editStationData(id) {
    var station = {};
    station.id = id;
    station.name = document.getElementById('edit-name').value;
    station.lat = document.getElementById('edit-lat').value;
    station.lon = document.getElementById('edit-lon').value;
    station.email = document.getElementById('edit-email').value;
    station.phone = document.getElementById('edit-phone').value;
    station.sim = document.getElementById('edit-sim').value;

    $.ajax({
        type: "POST",
        contentType: 'application/json',
        dataType: "json",
        url: "/data/update/station",
        data: JSON.stringify(station),
        success: function (result) {
            location.reload()
        }
    });
}

function deleteStation(id, key) {
    var url = "/data/delete/station/id/" + id + "/key/" + key;
    $.get(url, function (data, status) {
        if (status === 'success') {
            location.reload();
        }
    });
}