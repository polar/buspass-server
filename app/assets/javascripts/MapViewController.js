

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
                ctrl._setMapFeatures(route,response.features);
                ctrl._routeVectors.addFeatures(response.features);
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
        for(i in sroutes) {
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
            this._highlightFeatures(route.__mapFeatures);
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
            this._unhighlightFeatures(route.__mapFeatures);
            delete route.__nounhighlightTrigger;
        }
    },

    /**
     * Method: unhighlightAllRoutesNoTrigger
     * This method only unselects the routes in this View.
     * It doesn't trigger callbacks.
     */
    unhighlightAllRoutesNoTrigger : function() {
        for(i in this._routes) {
            // This may generate callbacks.
            this.unhighlightRouteNoTrigger(this._routes[i]);
        }
    },

    mapView : function(jquery) {
        this._map = new OpenLayers.Map($(jquery)[0].id);
        this._map.projection = "EPSG:23030";
        this._map.displayProjection = new OpenLayers.Projection("EPSG:4326");
        var mapnik = new OpenLayers.Layer.OSM("OpenStreetMap (Mapnik)");

        this._map.addLayers([mapnik]);
        this._map.addControl(new OpenLayers.Control.LayerSwitcher());
        this._map.addControl(new OpenLayers.Control.MousePosition());
        this._map.setCenter(new OpenLayers.LonLat(-76.146669, 43.050952).transform(
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
            new OpenLayers.Projection("EPSG:900913") // to Spherical Mercator Projection
        ), 13 // Zoom level
        );

        this._routeVectors = this._constructVectorLayer();
        console.log("created vector layer");
        this._map.addLayers([this._routeVectors]);
        console.log("added vector layer");
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

    _constructVectorLayer : function() {
        var ctrl = this;
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

        ctrl.defaultStyle.addRules([showOneOrAllRule,
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

        ctrl._highlightCtrl = new OpenLayers.Control.SelectFeature(layer, {
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

        ctrl._selectCtrl = new BusPass.MapViewController.SelectControl(layer, {
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
        return layer;
    }

};