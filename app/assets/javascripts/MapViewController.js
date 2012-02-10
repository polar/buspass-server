

BusPass.MapViewController = function(options) {
    this._routes = [];
    this._selectedRoutes = [];
    $.extend(this,options);
    if (this.scope == null) {
        this.scope = this;
    }
};

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
     * Constructor: OpenLayers.Control.SelectFeature
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
    }
    });


BusPass.MapViewController.prototype = {
    /**
     * Attribute: scope
     * This attribute is the context for the onRouteSelect,
     * onRouteUnselect, onRouteHighlight, and onRouteUnhighlight
     * callbacks.
     */
    scope : null,

    onRouteSelected : function () {},

    onRouteUnselected : function () {},

    onRouteHighlighted : function () {},

    onRouteUnhighlighted : function () {},

    defaultStyle : new OpenLayers.Style({
            strokeColor: "blue",
            strokeWidth: 5,
            strokeOpacity: 0.5,
            cursor: "pointer"
        }),

    selectStyle : new OpenLayers.Style({
            strokeColor: "red",
            strokeWidth: 5,
            strokeOpacity: 1.0,
            cursor: "pointer"
        }),

    highlightStyle : new OpenLayers.Style({
            strokeColor: "#00ff00",
            strokeWidth: 9,
            strokeOpacity: 1.0,
            graphicZIndex: 999,
            cursor: "pointer"
        }),

    /**
     * Method: addRoute
     * This method adds a route to the MapView.
     */
    addRoute : function(route) {
        this._routes.push(route);
        var ctrl = this;
        protocol = new OpenLayers.Protocol.HTTP({
            url: route.getGeoJSONUrl(),
            format: new OpenLayers.Format.GeoJSON({
                ignoreExtraDims: true,
                internalProjection: new OpenLayers.Projection("EPSG:900913"),
                                                externalProjection: new OpenLayers.Projection("EPSG:4326")
            }),
            callback : function(response) {
                // if response.features is null, there was an error. Maybe remove the route?
                if (response.features != null) {
                    ctrl._setMapFeatures(route,response.features);
                    if (route.__highlighted) {
                        ctrl._highlightFeatures(route.__mapFeatures);
                    }
                    ctrl._routeVectors.addFeatures(response.features);
                } else {
                    console.log("addRoute: Cannot download Route definition features: " + response.priv.status + " " + response.priv.statusText);
                }
            }
        });
        protocol.read();
    },

    _remove : function (a,x) {
        b = [];
        for(var i in a) {
            if (a[i] != x) {
                b.push(x);
            }
        }
        return b;
    },
    /**
     * Method: removeRoute
     * This method removes a route from the MapView
     */
    removeRoute : function(route) {
        this._selectedRoutes = this._remove(this._selectedRoutes,route);
        this._routes = this._remove(this._routes,route);
        // Does this call unselect call backs?
        this._routeVectors.removeFeatures(route.__mapFeatures);
        this._removeMapFeatures(route);
    },

    /**
     * Method: clearRoutes
     * This method removes all routes from the MapView
     */
    clearRoutes : function() {
        for(r in this._routes) {
            this._removeMapFeatures(routes[i]);
        }
        this._routes = [];
        this._selectedRoutes = [];
    },

    /**
     * Method: selectRouteNoTrigger
     * This method only selects the route in this View.
     * It doesn't trigger a callback.
     */
    selectRouteNoTrigger : function(route) {
        this._selectedRoutes.push(route);
        route.setSelected(true);
        route.__noSelectTrigger = true;
        // This will generate callbacks, maybe a couple per Route? Ugg.
        console.log("map.selectRouteNoTrigger: selecting " + route.getName() + ":" + route.getId());
        this._selectFeatures(route.__mapFeatures);
        delete route.__noSelectTrigger;
    },

    /**
     * Method: unselectRouteNoTrigger
     * This method only unselects the route in this View.
     * It doesn't trigger a callback.
     */
    unselectRouteNoTrigger : function(route) {
        this._selectedRoutes = this._remove(this._selectedRoutes,route);
        route.setSelected(false);
        route.__noUnselectTrigger = true;
        // This will generate callbacks.
        console.log("map.unselectRouteNoTrigger: unselecting " + route.getName() + ":" + route.getId());
        this._unselectFeatures(route.__mapFeatures);
        delete route.__noUnselectTrigger;
    },

    /**
     * Method: unselectAllRoutesNoTrigger
     * This method only unselects the routes in this View.
     * It doesn't trigger callbacks.
     */
    unselectAllRoutesNoTrigger : function() {
        console.log("map.unselectAllRoutes: unselecting");
        var sroutes = this._selectedRoutes;
        for(var i = 0; i < sroutes.length; i++) {
            // This will generate callbacks.
            console.log("map.unselectAllRoutes.route: unselecting " + sroutes[i].getName() + ":" + sroutes[i].getId());
            route.setSelected(false);
            route.__noUnselectTrigger = true;
            // This will generate callbacks.
            this._unselectFeatures(route.__mapFeatures);
            delete route.__noUnselectTrigger;
        }
        this._selectedRoutes = [];
    },

    /**
     * Method: highlightRouteNoTrigger
     * This method only highlights the routes in this View.
     * It doesn't trigger callbacks.
     */
    highlightRouteNoTrigger : function(route) {
        console.log("map.highlightRouteNoTrigger " + route.getName() + " - " + route.isSelected());
        // Do not want to highlight a selected item.
        if (!route.isSelected()) {
            route.__nohighlightTrigger = true;
            // This may generate callbacks.
            if (route.__mapFeatures) {
                this._highlightFeatures(route.__mapFeatures);
            } else {
                route.__highlighted = true;
            }
            delete route.__nohighlightTrigger;
        }
    },

    /**
     * Method: unhighlightRouteNoTrigger
     * This method only unhighlights the routes in this View.
     * It doesn't trigger callbacks.
     */
    unhighlightRouteNoTrigger : function(route) {
        console.log("map.unhighlightRouteNoTrigger " + route.getName() + " - " + route.isSelected());
        // A selected item doesn't have a highlight, doing this kills the selection.
        if (!route.isSelected()) {
            route.__nounhighlightTrigger = true;
            // This may generate callbacks.
            route.__highlighted = false;
            if (route.__mapFeatures) {
                this._unhighlightFeatures(route.__mapFeatures);
            }
            delete route.__nounhighlightTrigger;
        }
    },

    /**
     * Method: unhighlightAllRoutesNoTrigger
     * This method only unselects the routes in this View.
     * It doesn't trigger callbacks.
     */
    unhighlightAllRoutesNoTrigger : function() {
        for(var i = 0; i < this._routes.length; i++) {
            // This may generate callbacks.
            this.unhighlightRouteNoTrigger(this._routes[i]);
        }
    },

    mapView : function(jquery) {
        this._map = new OpenLayers.Map($(jquery)[0].id);
        this._map.projection = "EPSG:900913"; // Need by OSM
        this._map.displayProjection = new OpenLayers.Projection("EPSG:4326");
        var mapnik = new OpenLayers.Layer.OSM("OpenStreetMap (Mapnik)");
        this._map.addLayers([mapnik]);
        this._map.addControl(new OpenLayers.Control.LayerSwitcher());
        this._map.addControl(new OpenLayers.Control.MousePosition());
        this._map.setCenter(new OpenLayers.LonLat(-76.146669, 43.050952).transform(
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
             new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
        )
        , 13 // Zoom level
        );

        this._routeVectors = this._constructVectorLayer();
        console.log("created vector layer");
        this._locationMarkers = this._constructLocationLayer();
        this._map.addLayers([this._routeVectors,this._locationMarkers]);
        console.log("added vector and locations layer");
        this._setupSelectControls([this._routeVectors,this._locationMarkers]);
        console.log("added controls layer");
    },

    setVisibility : function(route, state) {
        // We set an attribute on the route so that the drawing intent
        // filter Rule will pick it up.
        route.setPathVisible(state);
    },


    setTracking : function(route, state) {
        // We set an attribute on the route so that the drawing intent
        // filter Rule will pick it up.
        route.setTracking(state);
    },

    moveAndCenterTo : function(route) {
        if (route.__mapFeatures != null) {
            var bounds = route.__mapFeatures[0].geometry.getBounds();
            bounds = bounds.scale(1.2); // Scale out a bit.
            //var centroid = route.__mapFeatures[0].geometry.getCentroid();
            this._map.zoomToExtent(bounds, true);
        }
    },

    moveToLocation : function(route) {
        if (route.__mapFeatures != null) {
            if (route.__marker != null) {
                this._map.panTo(route.__marker[0].__lonlat);
            }
        }
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
            var geoJSON = {
                type: "Feature",
                geometry: {
                    type : "Point",
                    coordinates : [lonlat.lon, lonlat.lat]
                },
                properties: {
                    icon : "/assets/busarrow.png"
                },
            }
            // In the direction (bearing) is opposite of how we must rotate
            // And the rotation must be in degrees.
            var rotation = -(direction / Math.PI)*180
            var parser = new OpenLayers.Format.GeoJSON();

            // We have a simple point as well incase the image
            // is not there.
            var marker1 = parser.parseFeature(geoJSON);
            var marker2 = parser.parseFeature(geoJSON);
            var marker = [marker1,marker2];

            // Point
            var style_mark1 = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
            style_mark1.graphicOpacity = 1;
            style_mark1.pointRadius = 5;
            marker1.style = style_mark1;
            marker1.__route = route; // For SelectControl
            marker1.__lonlat = lonlat;

            // Arrow Icon.
            var style_mark2 = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
            style_mark2.graphicOpacity = 1;
            // The pointRadius actually governs the size of the icon.
            style_mark2.pointRadius = 12;
            // 0,0 is for top,left of image
            style_mark2.externalGraphic = "/assets/busarrow.png";
            // defaults center it. For now that's good enough.
            //style_mark2.graphicXOffset = 0;
            //style_mark2.graphicYOffset = 0;
            style_mark2.rotation = rotation;
            style_mark2.graphicTitle = "" + route.getCode() + " " + route.getDisplayName();
            marker2.style = style_mark2;
            marker2.__route = route; // For SelectControl
            marker2.__lonlat = lonlat;

            this._locationMarkers.addFeatures(marker);
            route.__marker = marker;
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

    /**
     * Method: setMapFeatures
     * This function sets the features on the Route and associates
     * the route with each feature.
     *
     * Parameters
     * route   - <BusPass.Route> -
     * features - [<OpenLayers.Feature.Vector>]
     */
    _setMapFeatures : function(route, features) {
        route.__mapFeatures = features;
        $.each(route.__mapFeatures, function(i,a) {
            a.__route = route;
        });
    },

    _removeMapFeatures : function(route) {
        $.each(route.__mapFeatures, function(i,a) {
            a.__route = null;
        });
        route.__mapFeatures = null;
    },

    _selectFeatures : function(features) {
        var ctrl = this;
        // This call triggers callbacks.
        ctrl._selectCtrl.unselectAll();
        $.each(features, function(i,a) {
                ctrl._selectCtrl.select(a);
            });
    },

    _unselectFeatures : function(features) {
        var ctrl = this;
        // This call triggers callbacks.
        $.each(features, function(i,a) {
                ctrl._selectCtrl.unselect(a);
            });
        ctrl._routeVectors.redraw();
    },

    _highlightFeatures : function(features) {
        var ctrl = this;
        // This call triggers callbacks.
        $.each(features, function(i,a) {
            ctrl._highlightCtrl.highlight(a);
        });
    },

    _unhighlightFeatures : function(features) {
        var ctrl = this;
        // This call triggers callbacks.
        $.each(features, function(i,a) {
            ctrl._highlightCtrl.unhighlight(a);
        });
    },

    _constructLocationLayer : function() {
        var layer = new OpenLayers.Layer.Vector("Locations", {
        });
        return layer;
    },


    _constructVectorLayer : function() {
        var ctrl = this;
        var strokeWidth = new OpenLayers.Rule({
            context : function(feature) { return feature; },
                                             filter : new OpenLayers.Filter({
                                                 evaluate: function(feature) {
                                                     console.log("strokeWidth: zoom=" + ctrl._map.zoom);
                                                     return ctrl._map.zoom < 13;
                                                 }
                                             }),
                                             symbolizer: {
                                                 strokeWidth : 3
                                             }
        });
        var onTracking = new OpenLayers.Rule({
            context : function(feature) { return feature; },
                                              filter : new OpenLayers.Filter({
                                                  evaluate: function(feature) {
                                                      console.log("isTracking: " + ctrl._routeVectors.selectedFeatures.length+" - " + feature.__route.isTracking());
                                                      return feature.__route.isPathVisible() &&
                                                             feature.__route.isTracking();
                                                  }
                                              }),
                                              symbolizer: {
                                                  strokeColor: "green",
                                                  strokeOpacity : 0.8
                                              }
        });
        var pathVisible = new OpenLayers.Rule({
            context : function(feature) { return feature; },
                                              filter : new OpenLayers.Filter({
                                                  evaluate: function(feature) {
                                                      console.log("isPathVisible: " + ctrl._routeVectors.selectedFeatures.length+" - " + feature.__route.isPathVisible());
                                                      return !feature.__route.isPathVisible();
                                                  }
                                              }),
                                              symbolizer: {
                                                  display: "none"
                                              }
        });
        var showOneOrAllRule = new OpenLayers.Rule({
            context : function(feature) { return feature; },
            filter : new OpenLayers.Filter({
                evaluate: function(feature) {
                    console.log("select: " + ctrl._routeVectors.selectedFeatures.length+" - " + feature.__route.isSelected());
                    return ctrl._routeVectors.selectedFeatures.length > 0 &&
                                !feature.__route.isSelected();
                }
            }),
            symbolizer: {
                display: "none"
            }
        });

        ctrl.defaultStyle.addRules([strokeWidth, onTracking,pathVisible,showOneOrAllRule,
                                   // We nned this rule, because if none apply
                                   // it is not displayed.
                              new OpenLayers.Rule({
                                  elseFilter: true
                              })
        ]);

        //ctrl.highlightStyle = $.extend({graphicZIndex : 999}, ctrl.highlightStyle);

        var styleMap = new OpenLayers.StyleMap({
            'default': ctrl.defaultStyle,
            'select': ctrl.selectStyle,
            'highlight' : ctrl.highlightStyle
        });

        var layer = new OpenLayers.Layer.Vector("Routes", {
            // We want to bring hightlights up to the top. We need zIndexing
            // which works by a graphicZIndex style option.
            rendererOptions: {
                zIndexing : true
            },
            styleMap : styleMap
        });
        return layer;
    },

    _setupSelectControls : function (layers) {
        var ctrl = this;

        function report(ev) {
            console.log(ev);
        };

        function onHighlight(ev) {
            report(ev);
            var feature = ev.feature;
            var route = feature.__route;
            console.log("map.onHightlight: route " + route.getName() + " trigger " + !route.__nohighlightTrigger);
            if (route.__nohighlightTrigger) {
            } else {
                // When the Feature is a selected feature, onUnhighlight doesn't get
                // called on a mouseout. So, we don't propagate the call.
                if (!route.isSelected()) {
                    ctrl.onRouteHighlighted.call(ctrl.scope, route);
                }
            }
        };

        // When the Feature is a selected feature, onUnhighlight doesn't get
        // called on a mouseout. So, we don't propagate the call on onHighlight.
        function onUnhighlight(ev) {
            report(ev);
            var feature = ev.feature;
            var route = feature.__route;
            console.log("map.onUnhightlight: route " + route.getName() + " trigger " + !route.__nounhighlightTrigger);
            if (route.__nounhighlightTrigger) {
            } else {
                ctrl.onRouteUnhighlighted.call(ctrl.scope, route);
            }
        };

        function onSelectRoute(feature) {
            // feature has been selected, Just tell the RouteView of the selection.
            if (feature.__route.__noSelectTrigger) {
            } else {
                feature.__route.setSelected(true);
                ctrl.onRouteSelected.call(ctrl.scope, feature.__route);
            }
            ctrl._routeVectors.redraw();
        };

        // This gets called via selectRoute and also by
        // MouseEvent, which unselectsAll.
        function onUnselectRoute(feature) {
            // feature has been selected, Just tell the RouteView of the selection.
            if (feature.__route.__noUnselectTrigger) {
            } else {
                feature.__route.setSelected(false);
                ctrl.onRouteUnselected.call(ctrl.scope, feature.__route);
            }
        };

        function onClickout() {
            // This will have hit the onUnselectedRoute for every one selected?
            // Which will have cleared its select on the routesView.
            ctrl._routeVectors.redraw();
        };

        ctrl._highlightCtrl = new OpenLayers.Control.SelectFeature(layers, {
            hover: true,
            highlightOnly: true,
            multiple: true,
            renderIntent: "highlight",
            eventListeners: {
                beforefeaturehighlighted: report,
                featurehighlighted: onHighlight,
                //featureunhighlghted does not get called if selected. Ugg.
                // Probably due to the other Selection Controller calling
                // highlight when the feature is selected?
                featureunhighlighted: onUnhighlight
            },
        });

        ctrl._selectCtrl = new BusPass.MapViewController.SelectControl(layers, {
                scope: ctrl,
                onSelect: onSelectRoute,
                onUnselect: onUnselectRoute,
                onClickout : onClickout,
                clickout: true,
                multiple: false
            });

        ctrl._map.addControl(ctrl._highlightCtrl);
        ctrl._map.addControl(ctrl._selectCtrl);

        ctrl._highlightCtrl.activate();
        ctrl._selectCtrl.activate();
    }

};
