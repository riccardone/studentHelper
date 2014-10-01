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
            //onNavigateHome
            app.locationService.viewModel.set("school", school);
            app.locationService.viewModel.school.set("isLoaded", true);
            app.locationService.viewModel.onNavigateHome.apply(app.locationService.viewModel, []);
            
            /*map.addMarker({
            lat: lat,
            lng: lon,
            title: school.schoolName,
            click: function(e) {
            //alert('You clicked in this marker');
            }
            });*/
            
            kendo.bind(e.view.element, app.locationService.viewModel, kendo.mobile.ui);
            
            /*dataContext.setWatchCallback(function(args) {
            var position = args[0];
            if (position) {                                  
            savePosition(app.Friends.currentUser.data.Id, position); 
            console.log('Position for friend received and processed');
            }
            });            
            
            app.locationService.viewModel.friend.set('isLoaded', true);          
            
            function savePosition(userId, position) {                            
            // Save current user location and update connected user location
            return dataContext.savePosition(userId, position).then(function(data) { 
            app.Friends.currentUser.set('LastLocation', { latitude: position.coords.latitude, 'longitude': position.coords.longitude });                
            console.log('savePosition: ' + JSON.stringify(data));
            if (data.result.length > 0) {                        
            for (var i = 0; i < data.result.length; i++) {                                                      
            if (app.locationService.viewModel.friend.Id === data.result[i].LocationInfo.UserId) {
            app.locationService.viewModel.friend.set('FriendSessionId', data.result[i].FriendSessionId);
            app.locationService.viewModel.friend.set('FriendSessionActive', data.result[i].Active);
            app.locationService.viewModel.friend.set('LastLocation', data.result[i].LocationInfo.LastLocation);
            app.locationService.viewModel.friend.set('ModifiedAt', data.result[i].LocationInfo.ModifiedAt);
            app.locationService.viewModel.friend.set('Distance', data.result[i].LocationInfo.Distance);
            app.locationService.viewModel.friend.set('RequestSent', data.result[i].RequestSent);
            app.locationService.viewModel.friend.set('RequestReceived', data.result[i].RequestReceived);
            app.locationService.viewModel.friend.set('CurrentUserLocation', app.Friends.currentUser.LastLocation);                                 
            var friendPosition = new google.maps.LatLng(data.result[i].LocationInfo.LastLocation.latitude, data.result[i].LocationInfo.LastLocation.longitude);
            // TODO find another place where do this
            map.panTo(friendPosition);
            app.locationService.viewModel._putMarker(friendPosition);
            } else {
            }
            }                        
            } else {
            app.locationService.viewModel.friend.set('FriendSessionActive', false);
            app.locationService.viewModel.friend.set('LastLocation', null);                    
            app.locationService.viewModel.friend.set('Distance', 0);
            app.locationService.viewModel.friend.set('RequestSent', false);
            app.locationService.viewModel.friend.set('RequestReceived', false);
            }
            if (app.locationService.viewModel.friend.FriendSessionActive) {
            app.locationService.viewModel.friend.set('showMap', true);	
            } else {                        
            app.locationService.viewModel.friend.set('showMap', false);	
            }                    
            kendo.bind($("#view-friend"), app.locationService.viewModel, kendo.mobile.ui);
            }, function(error) {
            console.log(JSON.stringify(error));
            });
            } */  
            
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
        
        sendFriendRequest: function() {   
            if (app.locationService.viewModel.friend.FriendSessionActive === false) {
                app.mobileApp.showLoading();
                dataContext.createFriendSession(app.locationService.viewModel.friend.Id, function(data) {
                    app.locationService.viewModel.friend.set('RequestSent', true);                                        
                    app.mobileApp.hideLoading();                    
                    kendo.bind($("#view-friend"), app.locationService.viewModel, kendo.mobile.ui);
                }, function(error) {
                    app.mobileApp.hideLoading();
                    console.log(JSON.stringify(error));
                });	            
            }
        },
        
        acceptFriendConnection: function () {
            if (app.locationService.viewModel.friend.FriendSessionActive === false && app.locationService.viewModel.friend.FriendSessionId !== -1) {
                app.mobileApp.showLoading();
                dataContext.acceptFriendSessionRequest(app.locationService.viewModel.friend.FriendSessionId, function(data) {
                    app.locationService.viewModel.friend.set('FriendSessionActive', true);
                    app.locationService.viewModel.set('showMap', true);
                    app.mobileApp.hideLoading();                
                    kendo.bind($("#view-friend"), app.locationService.viewModel, kendo.mobile.ui);
                    console.log(JSON.stringify(data.result));
                }, function(error) {
                    app.mobileApp.hideLoading();
                    console.log(JSON.stringify(error));
                });	
            }  
        },
        
        disconnectFriend: function() {
            if (app.locationService.viewModel.friend.FriendSessionActive && app.locationService.viewModel.friend.FriendSessionId !== -1) {
                app.mobileApp.showLoading();
                dataContext.disconnectFriend(app.locationService.viewModel.friend.FriendSessionId, function(data) {
                    app.locationService.viewModel.friend.set('FriendSessionActive', false);
                    app.locationService.viewModel.friend.set('RequestSent', false);
                    app.locationService.viewModel.friend.set('RequestReceived', false);
                    app.locationService.viewModel.set('showMap', false);
                    app.mobileApp.hideLoading();                
                    kendo.bind($("#view-friend"), app.locationService.viewModel, kendo.mobile.ui);
                    console.log(JSON.stringify('Friend disconnected: ' + data.result));
                }, function(error) {
                    app.mobileApp.hideLoading();
                    console.log(JSON.stringify(error));
                });	
            }  
        }
        
    };
}
)(window);