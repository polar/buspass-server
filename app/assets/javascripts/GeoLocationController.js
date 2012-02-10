BusPass.GeoLocationController = function (options) {
    $.extend(this,options);
    
    var control = new BusPass.GeoLocationController.Control.Click( {
        scope : this,
        map : this.map.
        onLocationUpdated : this.onLocationUpdated,
    });
    
    this.map.addControl(control);
    control.activate();
};
BusPass.GeoLocationController.Control.Click = OpenLayers.Class(OpenLayers.Control, {                
                defaultHandlerOptions: {
                    'single': true,
                    'double': false,
                    'pixelTolerance': 0,
                    'stopSingle': false,
                    'stopDouble': false
                },

                initialize: function(options) {
                    this.handlerOptions = OpenLayers.Util.extend(
                        {}, this.defaultHandlerOptions
                    );
                    OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                    ); 
                    this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'click': this.trigger
                        }, this.handlerOptions
                    );
                }, 

                trigger: function(e) {
                    var lonlat = map.getLonLatFromViewPortPx(e.xy);
                    console.log("onLocationUpdated " + lonlat.lon + "," +
                                              + lonlat.lat );
                    this.scope.call('.onLocationUpdated',scope,lonlat);
                }

            });
BusPass.GeoLocationController.prototype = {
    /**
     * Attribute: map (required)
     * The OpenLayersMap.
     */
    map : null,
    
    markerLayer : null,
    
    onLocationUpdate : function (ctrl, lonlat) {
        
    },
    
    
};