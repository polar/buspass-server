

BusPass.LocationMapViewController = OpenLayers.Class( BusPass.MapViewController, {
    /**
     * Attribute:
     * This attribute contains the 'default' and 'temporary' styles
     * for drawing the icons on the map.
     */
    locationStyleMap : new OpenLayers.StyleMap({
        'default': new OpenLayers.Style( {
            graphicOpacity : 1,
            pointRadius : 12,
            graphicZIndex: 1000,
            externalGraphic : "/assets/busarrow.png",
        }),
        'highlight': new OpenLayers.Style({
            graphicOpacity : .9,
            pointRadius : 12,
            graphicZIndex: 1000,
            externalGraphic : "/assets/busarrow_highlight.png",
        }),
        'temporary': new OpenLayers.Style({
            graphicOpacity : 0.3,
            pointRadius : 12,
            graphicZIndex: 1000,
            externalGraphic : "/assets/busarrow.png",
        }),
    }),


    /**
     * Constructor: BusPass.MapViewController
     */
    initialize : function (options) {
        console.log("LocationMapViewController: initialize" + $.toJSON(options));

        BusPass.MapViewController.prototype.initialize.apply(this, [options]);
    },

    mapView : function(jquery) {
        BusPass.MapViewController.prototype.mapView.apply(this,[jquery]);

        // These are attributes we put on the Location Feature.
        OpenLayers.Util.extend(this.locationStyleMap.styles['default'].defaultStyle, {
            rotation : '${rotation}',
            graphicTitle : '${title}'
        });
        // We have to reset the style with setDefaultStyle so it
        // will pick up the attribute replacement symbols.
        this.locationStyleMap.styles['default'].setDefaultStyle(
            this.locationStyleMap.styles['default'].defaultStyle);

        this._locationMarkers = this._constructLocationLayer();
        this._map.addLayers([this._locationMarkers]);
        console.log("added vector and locations layer");
        // The activation of these controls brings them to the top
        // and they stay there (to catch MouseEvents).
        // We need to move them back.
        //this._highlightCtrl.handlers.feature.moveLayerBack();
       // this._selectCtrl.handlers.feature.moveLayerBack();
        // This replaces the first set of controls.
        // For some reason if we don't do this, the location markers
        // end up on the bottom.
        var layers = [this._routeVectors, this._locationMarkers];
        this._setupSelectControls(layers);

        var ctrl = this;

        function onHighlight(ev) {
            var feature = ev.feature;
            var route = feature.__route;
            console.log("map.onHightlight: route " + route.getName() + " trigger " + !route.__nohighlightTrigger);
            if (route.__nohighlightTrigger) {
            } else {
                if (feature == route.__marker) {
                    features = route.__mapFeatures;
                    for(var i = 0; i < features.length; i++) {
                        // We do this so we don't trigger and come right back here.
                        ctrl._highlightCtrl.highlight(features[i]);
                    }
                }
            }
        };

        // When the Feature is a selected feature, onUnhighlight doesn't get
        // called on a mouseout. So, we don't propagate the call on onHighlight.
        function onUnhighlight(ev) {
            var feature = ev.feature;
            var route = feature.__route;
            console.log("map.onUnhightlight: route " + route.getName() + " trigger " + !route.__nounhighlightTrigger);
        };

        ctrl._locationHighlightCtrl = new OpenLayers.Control.SelectFeature(layers, {
            hover: true,
            highlightOnly: true,
            multiple: false,
            renderIntent: "highlight",
            eventListeners: {
                featurehighlighted: onHighlight,
                //featureunhighlghted does not get called if selected. Ugg.
                // Probably due to the other Selection Controller calling
                // highlight when the feature is selected?
                featureunhighlighted: onUnhighlight
            },
        });
        ctrl._map.addControl(ctrl._locationHighlightCtrl);
        ctrl._locationHighlightCtrl.activate();
    },

    /**
     * Method: setLocation
     *
     * This method sets the location for the route. It performs
     * the display of the bus arrow icon and does so by
     * creating Vector Features and placing them on the markers
     * layer.
     *
     * Paramteers
     * route   <Route>  The route to set the location on.
     *                  It should be of type "journey".
     * loc     [lon,lat] It can be null, in which case the
     *                   marker will be removed.
     * direction <Radians> Bearing from North.
     */
    setLocation : function(route, loc, direction) {
        if (route.__marker != null) {
            this._locationMarkers.removeFeatures(route.__marker);
            route.__marker = null;
        }
        if (loc != null) {
            var lonlat = new OpenLayers.LonLat(loc[0],loc[1]).transform(
                new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
                new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
            );
            // Feature will have 'default' style.
            var geometry = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
            // In the direction (bearing) is opposite of how we must rotate
            // And the rotation must be in degrees.
            var rotation = -(direction / Math.PI)*180
            var attributes = {
                'direction' : direction,
                'rotation' : rotation,
                'route' : route,
                'lonlat' : lonlat,
                'title' :  "" + route.getCode() + " " + route.getDisplayName()
            };
            var marker = new OpenLayers.Feature.Vector(geometry, attributes);
            this._locationMarkers.addFeatures(marker);

            marker.__route = route; // For SelectControl
            marker.__lonlat = lonlat;
            route.__marker = marker;

//             // The pointRadius actually governs the size of the icon.
//             marker.style.pointRadius = 12;
//             marker.style.rotation = rotation;
//             marker.style.graphicTitle = "" + route.getCode() + " " + route.getDisplayName();
        }
    },

    /**
     * Method: redraw
     * This method triggers a redraw of the vector layer. It returns
     * a boolean if the layer was redrawn, which is an OpenLayers return
     * for Layer.redraw().
     */
    redraw : function () {
        this._routeVectors.redraw();
        this._locationMarkers.redraw();
    },

    _constructLocationLayer : function() {
        var layer = new OpenLayers.Layer.Vector("Locations", {
            rendererOptions: {
                zIndexing : true
            },
            styleMap : this.locationStyleMap
        });
        return layer;
    },

});

BusPass.MapViewController.SelectControl = OpenLayers.Class(OpenLayers.Control.SelectFeature, {
    /**
     * APIProperty: onSelect
     * {Function} Optional function to be called when a feature is selected.
     *     The function should expect to be called with a feature.
     */
    onClickout: function() {},

    // Override
    clickoutFeature : function(feature) {
        if(!this.hover && this.clickout) {
            this.unselectAll();
            this.onClickout.call(this.scope);
        }
    },

    /**
    * Constructor: BusPass.MapViewController.SelectControl
    * Create a new control for selecting features.
    *
    * Parameters:
    * layers - {<OpenLayers.Layer.Vector>}, or an array of vector layers. The
    *     layer(s) this control will select features from.
    * options - {Object}
    */
    initialize: function(layers, options) {
        OpenLayers.Control.SelectFeature.prototype.initialize.apply(this, [layers, options]);
        console.log("arg layers: " + layers);
        console.log("layer: " + this.layer);
    },

    CLASS_NAME: "BusPass.LocationMapViewController"
});
