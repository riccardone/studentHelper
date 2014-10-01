(function (global) {
    var map,
        geocoder,
        LocationViewModel,
        app = global.app = global.app || {};

    LocationViewModel = kendo.data.ObservableObject.extend({
                                                               _lastMarker: null,
                                                               _isLoading: false,

                                                               address: "",
                                                               isGoogleMapsInitialized: false,                                                               
                                                               hideSearch: false,
                                                               school: { isLoaded: false },

                                                               onNavigateHome: function () {
                                                                   var that = this,
                                                                       position;

                                                                   that._isLoading = true;
                                                                   that.toggleLoading();
                                                                   
                                                                   if (that.school.isLoaded) {
                                                                       var lat = that.school.location.Latitude;
                                                                       var lon = that.school.location.Longitude;
                                                                       var schoolPosition = new google.maps.LatLng(lat, lon);                                                                       
                                                                       that._putMarker(schoolPosition);
                                                                       map.panTo(schoolPosition);	
                                                                   }                                                                   

                                                                   navigator.geolocation.getCurrentPosition(
                                                                       function (position) {
                                                                           position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                                                                           //map.panTo(position);
                                                                           //that._putMarker(position);
                                                                           that._isLoading = false;
                                                                           that.toggleLoading();
                                                                       },
                                                                       function (error) {
                                                                           //default map coordinates
                                                                           position = new google.maps.LatLng(43.459336, -80.462494);
                                                                           map.panTo(position);

                                                                           that._isLoading = false;
                                                                           that.toggleLoading();

                                                                           navigator.notification.alert("Unable to determine current location. Cannot connect to GPS satellite.",
                                                                                                        function () {
                                                                                                        }, "Location failed", 'OK');
                                                                       }, {
                                                                           timeout: 30000,
                                                                           enableHighAccuracy: true
                                                                       }
                                                                       );
                                                               },

                                                               onSearchAddress: function () {
                                                                   var that = this;

                                                                   geocoder.geocode({
                                                                                        'address': that.get("address")
                                                                                    },
                                                                                    function (results, status) {
                                                                                        if (status !== google.maps.GeocoderStatus.OK) {
                                                                                            navigator.notification.alert("Unable to find address.",
                                                                                                                         function () {
                                                                                                                         }, "Search failed", 'OK');

                                                                                            return;
                                                                                        }

                                                                                        map.panTo(results[0].geometry.location);
                                                                                        that._putMarker(results[0].geometry.location);
                                                                                    });
                                                               },

                                                               toggleLoading: function () {
                                                                   if (this._isLoading) {
                                                                       kendo.mobile.application.showLoading();
                                                                   } else {
                                                                       kendo.mobile.application.hideLoading();
                                                                   }
                                                               },

                                                               _putMarker: function (position) {
                                                                   var that = this;

                                                                   if (that._lastMarker !== null && that._lastMarker !== undefined) {
                                                                       that._lastMarker.setMap(null);
                                                                   }

                                                                   that._lastMarker = new google.maps.Marker({
                                                                                                                 map: map,
                                                                                                                 position: position
                                                                                                             });
                                                               }
                                                           });

    app.locationService = {        
        initLocation: function () {
            var mapOptions,
                streetView;

            if (typeof google === "undefined") {
                return;
            }

            app.locationService.viewModel.set("isGoogleMapsInitialized", true);

            mapOptions = {
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.LEFT_BOTTOM
                },

                mapTypeControl: false,
                streetViewControl: false
            };

            map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
            geocoder = new google.maps.Geocoder();
            //app.locationService.viewModel.onNavigateHome.apply(app.locationService.viewModel, []);
            
            streetView = map.getStreetView();

            google.maps.event.addListener(streetView, 'visible_changed', function() {
                if (streetView.getVisible()) {                  
                    app.locationService.viewModel.set("hideSearch", true);
                } else {
                    app.locationService.viewModel.set("hideSearch", false);
                }
            });
        },

        show: function (e) {
            var school = app.Schools.schools.getByUid(e.view.params.uid);
            var lat = e.view.params.lat;            
            var lon = e.view.params.lon;            
            school.distance = dataContext.calculateDistance({lat: school.location.Latitude, lon:school.location.Longitude}, {lat: lat, lon: lon});                        
            app.locationService.viewModel.set("school", school);
            app.locationService.viewModel.school.set("isLoaded", true);
            app.locationService.viewModel.onNavigateHome.apply(app.locationService.viewModel, []);
            kendo.bind(e.view.element, app.locationService.viewModel, kendo.mobile.ui);
            
            if (!app.locationService.viewModel.get("isGoogleMapsInitialized")) {
                return;
            }

            //resize the map in case the orientation has been changed while showing other tab
            google.maps.event.trigger(map, "resize");
        },

        hide: function () {
            //hide loading mask if user changed the tab as it is only relevant to location tab
            kendo.mobile.application.hideLoading();
        },

        viewModel: new LocationViewModel(),
        onActivitiesClick: function (){
            app.mobileApp.navigate('views/activitiesView.html');
        }
    };
}
)(window);