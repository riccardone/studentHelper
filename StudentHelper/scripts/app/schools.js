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
                schoolName: {
                        field: 'schoolName',
                        defaultValue: ''
                    },
                address: {
                        field: 'address',
                        defaultValue: ''
                    },
                location: {
                        field: 'location',
                        defaultValue: null
                    }               
            }
        };
        
        var positionCache;
        var studentCityName = '';
        //var url = '';
        
        var getCityName = function() {
            return studentCityName;
        }
        
        var getPosition = function() {
            return positionCache;
        }
        
        var schoolsDataSource = new kendo.data.DataSource({
                                                              //data: [{"code":"LOC","schoolName":"KIC London Covent Garden","address":"3-4 Southampton Place, Covent Garden, London, UK","location":{"Longitude":-0.121794,"Latitude":51.5182}},{"code":"LOL","schoolName":"KIC London Leic. Square","address":"lan International London, 3 - 5 Charing Cross Road, London, United Kingdom","location":{"Longitude":-0.128781,"Latitude":51.5098}}]           
                                                              schema: {
                model: schoolModel
            },            
                                                              sort: { field: 'SchoolName', dir: 'asc' }
                                                          });
        
        function _handleRefresh() {
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
                        $.each(val['types'], function(i, val2) {
                            if (val2 === "locality") {
                                if (val['long_name'] !=="") {
                                    studentCityName = val['long_name']; 
                                    positionCache = position;
                                    dataContext.getSchoolsByCity(studentCityName).then(function(data) {
                                        schoolsDataSource.data(data);                                           
                                    });
                                } else {
                                    studentCityName = "unknown";
                                }                                
                                console.log('Set city for this student: ' + studentCityName);
                            }    
                        });
                    });
                });
                //app.mobileApp.hideLoading();                
            }, function (err) { 
                console.log('error: ' + err);
            });                
        }
        
        var _onError = function(error) {
            console.log('code: ' + error.code + '<br/>' +
                        'message: ' + error.message + '<br/>');
        }
        
        return {
            schools: schoolsDataSource,
            handleRefresh: _handleRefresh,
            getCityName: getCityName,
            getPosition: getPosition
        };
    }());

    // Schools view model
    var schoolsViewModel = (function () {   
        var position;
        
        var show = function (e) { 
            schoolsModel.schools.bind("change", function() {
                cityName = schoolsModel.getCityName();                
                kendo.bind(e.view.element, schoolsViewModel, kendo.mobile.ui);
            });
            
            schoolsModel.handleRefresh();               
        };
        
        var schoolSelected = function (e) {
            position = schoolsModel.getPosition();
            app.mobileApp.navigate('views/schoolView.html?uid=' + e.data.uid + '&lat=' + position.coords.latitude + '&lon=' + position.coords.longitude);
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
        
        var cityName = "";
        
        var studentCityName = function() {
            return cityName;
        }

        return {
            schools: schoolsModel.schools,            
            show: show,
            logout: logout,
            studentCity: studentCityName,
            schoolSelected: schoolSelected
        };
    }());

    return schoolsViewModel;
}());