function Route(apiMap) {
    this._apiMap = apiMap;
    this._selected = false;
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
     * Method: getDisplayName
     * This method returns the string that will be used to display
     * the route.
     *
     * Returns: String
     */
    getDisplayName : function() {
        return this.getName();
    },

    /**
     * Method: setMap
     * This function sets the Map for which the Route is
     * drawn on.
     *
     * Parameters:
     * map - {<BusPass.Map>}
     */
    setMap : function(map) {
        this._map = map;
    },

    /**
     * Method: getMap
     * This function gets the Map for which the Route is
     * drawn on.
     *
     * Returns:
     * {<BusPass.Map}
     */
    getMap : function() {
        return this._map;
    },

    /**
     * Method: setMapFeatures
     * This function sets the feature on the map.
     * This call is used when the Route is loaded from Internet Data.
     *
     * Parameters
     * features [<OpenLayers.Feature.Vector>]
     */
    setMapFeatures : function(features) {
        var self = this;
        this._mapFeatures = features;
        $.each(this._mapFeatures, function(i,a) {
                a.__route = self;
            });
    },

    /**
     * Method: getMapFeatures
     * This method returns the vector features associated with the
     * this Route.
     *
     * Returns:
     * [<OpenLayers.Feature.Vector>]
     */
    getMapFeatures : function(features) {
        return this._mapFeatures;
    },

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

};