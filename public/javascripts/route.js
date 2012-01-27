Route.prototype = {
  _nw_lon: null,
  _nw_lat : null, 
  _se_lon : null, 
  _se_lat : null,
  _startOffset : null,
  _duration : null,
  _startTime : null,
  _endTime : null,
  _nameId : null,
  getNameId : function() {
    return _nameId;
  },

  _id : null,
  getId : function() {
    return _id;
  },

  _name : null,
  getName : function() {
    return _name;
  },

  _code : null,
  getCode: function() {
    return _code;
  },

  _paths : null,
  getPaths : function() {
    return _paths;
  },

  getPath : function(index) {
    return _paths[index];
  },

  _lastKnownTimeDiff: null,
  getLastKnownTimeDiff : function () {
    return _lastKnownTimeDiff;
  },

  _lastKnownTime: null,
  getLastKnownTime : function () {
    return _lastKnownTime;
  },

  _lastKnownLocation: null,
  getLastKnownLocation : function () {
    return _lastKnownLocation;
  },

  _lastKnownDirection: null,
  getLastKnownDirection : function () {
    return _lastKnownDirection;
  },

  _onRoute : null,
  isOnRoute : function() {
   return _onRoute;
  },

  _type : null,
  isJourney : function() {
    return _type == "journey";
  },

  isRouteDefinition : function() {
    return _type == "route";
  },

  _locationRefreshRate : null,
  getLocationRefreshRate : function() {
    return _locationRefreshRate;
  },

  _zoomCenter : null,
  getZoomCenter : function() {
    return _zoomCenter;
  },
  
  isNearRoute : function(where, buffer) {
    // TODO: fill in
  },

  pollForCurrentLocation : function() {
    // TODO: fill in.
  }

}