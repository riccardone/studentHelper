var dataContext = (function () {
    'use strict';
    
    var earthRadius = 6371;

    function calculateDistance(posA, posB) {
        var lat = posB.lat - posA.lat; // Difference of latitude
        var lon = posB.lon - posA.lon; // Difference of longitude

        var disLat = (lat * Math.PI * earthRadius) / 180; // Vertical distance
        var disLon = (lon * Math.PI * earthRadius) / 180; // Horizontal distance

        var ret = Math.pow(disLat, 2) + Math.pow(disLon, 2); 
        ret = Math.sqrt(ret); // Total distance (calculated by Pythagore: a^2 + b^2 = c^2)

        // Now you have the total distance in the variable ret
        return ret;
    }   
    
    function getCityName(lat, lng) {
        return $.ajax({
                          type: 'GET',
                          dataType: "json",
                          url: "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lng + "&sensor=false",
                          data: {}         
                      }); 
    }
    
    // The public API
    return { 
        calculateDistance: calculateDistance,
        getCityName: getCityName
    }
}());