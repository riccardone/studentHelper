/**
 * Activities view model
 */

var app = app || {};

app.Schools = (function () {
    'use strict'

    // Schools model
    var schoolsModel = (function () {
        var schoolModel = {

            id: 'code',
            fields: {
                SchoolName: {
                        field: 'schoolName',
                        defaultValue: ''
                    },
                Address: {
                        field: 'address',
                        defaultValue: ''
                    },
                Location: {
                        field: 'location',
                        defaultValue: null
                    }                
            },
            isVisible: function () {                
                if (this.get('Location')) {
                    return true;
                }
                return false;
            }
        };
        
        var studentCityName = "";
       
        var schoolsDataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    url: "https://testapi.kaplaninternational.com/api/schools/" + studentCityName + "?access_token=kicbus",
                    dataType: "jsonp"
                }
            },
            schema: {
                model: schoolModel
            },
            change: function (e) {
                if (e.items && e.items.length > 0) {
                    $('#no-activities-span').hide();
                } else {
                    $('#no-activities-span').show();
                }
            },
            sort: { field: 'SchoolName', dir: 'asc' }
        });
        
        var _handleRefresh = function() {
            var options = {
                enableHighAccuracy: true
            },
                that = this;
        
            console.log("Waiting for geolocation information...");
        
            navigator.geolocation.getCurrentPosition(function() {
                _onSuccess.apply(that, arguments);
            }, function() {
                _onError.apply(that, arguments);
            }, options);
        }
        
        var _onSuccess = function(position) {
            // Successfully retrieved the geolocation information. Display it all.
            dataContext.getCityName(position.coords.latitude, position.coords.longitude).then(function(data) {
                $.each(data['results'], function(i, val) {
                    $.each(val['address_components'], function(i, val) {
                        if (val['types'] === "locality,political") {
                            if (val['long_name'] !=="") {
                                studentCityName = val['long_name'];
                                schoolsDataSource.read();
                            } else {
                                studentCityName = "unknown";
                            }
                            console.log(i + ", " + val['long_name']);
                            console.log(i + ", " + val['types']);
                        }
                    });
                });
                console.log('Success');
            }, function (err) { 
                console.log('error: ' + err);
            });                
        }
        
        var _onError = function(error) {
            console.log('code: ' + error.code + '<br/>' +
                        'message: ' + error.message + '<br/>');
        }
        
        _handleRefresh();

        return {
            schools: schoolsDataSource
        };
    }());

    // Schools view model
    var schoolsViewModel = (function () {
        // Navigate to activityView When some activity is selected
        var activitySelected = function (e) {
            app.mobileApp.navigate('views/activityView.html?uid=' + e.data.uid);
        };

        // Navigate to app home
        var navigateHome = function () {
            app.mobileApp.navigate('#welcome');
        };

        // Logout user
        var logout = function () {
            app.helper.logout()
                .then(navigateHome, function (err) {
                    app.showError(err.message);
                    navigateHome();
                });
        };

        return {
            schools: schoolsModel.schools,
            activitySelected: activitySelected,
            logout: logout
        };
    }());

    return schoolsViewModel;
}());