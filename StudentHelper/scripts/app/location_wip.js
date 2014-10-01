var app = app || {};

app.LocationService = (function () {
    'use strict'    
    
    var locationServiceModel = (function(){
        var schoolModel = {
            
        }
    });
    
    var locationViewModel = (function () {
        var school;
        
        var init = function () {
            
        };

        var show = function (e) {
            var schoolUid = e.view.params.uid;            
            var lat = e.view.params.lat;            
            var lon = e.view.params.lon;            
            school = app.Schools.schools.getByUid(schoolUid);
            school.distance = dataContext.calculateDistance({lat: school.location.Latitude, lon:school.location.Longitude}, {lat: lat, lon: lon});
            kendo.bind(e.view.element, school, kendo.mobile.ui);
        };
        
        return {
            init: init,
            show: show,            
            school: function () {
                return school;
            }
        };
        
    }());
    
    return locationViewModel;    
}());
