Route = function(data) {
    this._selected = false;
    $.extend(this,data);
};

Route.prototype = {
    _nw_lon: null,
    _nw_lat : null,
    _se_lon : null,
    _se_lat : null,
    _startOffset : null,
    _duration : null,
    _startTime : null,
    _endTime : null,

    _getGeoJSONUrl : null,
    getGeoJSONUrl : function() {
        return this._getGeoJSONUrl;
    },

    _nameId : null,
    getNameId : function() {
        return this._nameId;
    },

    _id : null,
    getId : function() {
        return this._id;
    },

    _name : null,
    getName : function() {
        return this._name;
    },

    _code : null,
    getCode: function() {
        return this._code;
    },

    _paths : null,
    getPaths : function() {
        return this._paths;
    },

    getPath : function(index) {
        return this._paths[index];
    },

    _lastKnownTimeDiff: null,
    getLastKnownTimeDiff : function () {
        return this._lastKnownTimeDiff;
    },

    _lastKnownTime: null,
    getLastKnownTime : function () {
        return this._lastKnownTime;
    },

    _lastKnownLocation: null,
    getLastKnownLocation : function () {
        return this._lastKnownLocation;
    },

    _lastKnownDirection: null,
    getLastKnownDirection : function () {
        return this._lastKnownDirection;
    },

    _onRoute : null,
    isOnRoute : function() {
        return this._onRoute;
    },

    _type : null,
    getType : function() {
        return this._type;
    },

    _version : null,
    getVersion : function () {
        return this._version;
    },

    isJourney : function() {
        return this._type == "journey";
    },

    isRouteDefinition : function() {
        return this._type == "route";
    },

    _locationRefreshRate : null,
    getLocationRefreshRate : function() {
        return this._locationRefreshRate;
    },

    _zoomCenter : null,
    getZoomCenter : function() {
        return this._zoomCenter;
    },

    isNearRoute : function(where, buffer) {
        // TODO: fill in
    },

    pollForCurrentLocation : function() {
        // TODO: fill in.
    },

    // Display Stuff
    /**
     * Method: setSelected
     * This method sets the isSelected boolean.
     * It is called when one of the vector features
     * is selected by the Map.
     *
     * Parameters
     * select  boolean
     */
    setSelected : function(select) {
        this._selected = select;
    },

    /**
     * Method: isSelected
     * This method returns whether the Route is selected in the Display
     * Area.
     *
     * Returns
     * boolean
     */
    isSelected : function() {
        return this._selected;
    },

    // JourneyDisplay Stuff

    getDisplayName : function () {
        return this.getName();
    },

    setNameVisible : function (state) {
        this._nameVisible = state;
    },

    isNameVisible : function () {
        return this._nameVisible;
    },

    setNameHighlighted : function (state) {
        this._nameHighlighted = state;
    },

    isNameHighlighted : function () {
        return this._nameHighlighted;
    },

    setPathVisible : function (state) {
        this._pathVisible = state;
    },

    isPathVisible : function () {
        return this._pathVisible;
    },

    setHasActiveJourneys : function (state) {
        this._hasActiveJourneys = state;
    },

    isHasActiveJourneys : function () {
        return this._hasActiveJourneys;
    },

    // Compatability with JourneyDisplay in Java
    getRoute : function () {
        return this;
    },

    onJourneyDisplayLocationUpdateListener : {
        onJourneyDisplayLocationUpdate : function(journeyDisplay, locations) {}
    },

    // JourneyDisplay is a location update listener.
    onLocationUpdate : function(route, locations) {
        this.onJourneyDisplayLocationUpdateListener.onJourneyDisplayLocationUpdate(this, locations);
    },


};