BusPass.ActivePlanController = function(options) {
    this._routes = [];
    $.extend(this,options);
    this._stateStack = [];
    this._stateStack.push(new BusPass.ActivePlanController.VisualState());
    
    this._mapViewC = new BusPass.MapViewController({
        scope : this,
        onRouteSelected : this._onMapRouteSelect,
        onRouteHighlighted : this._onMapRouteHighlight,
        onRouteUnhighlighted : this._onMapRouteunhighlight,
    });
    var rctrl = this;
    this._listViewC = new BusPass.ListViewController({
        scope : this,
        // This will only happen if the Map fires a selection.
        onRouteHighlighted : this._onListRouteHighlight,
        onRouteUnhighlighted : this._onListRouteUnhighlight,
        onRouteClicked : function (ctrl, route) {
            rctrl._onListRouteClicked(ctrl,route);
        },
    });
};
BusPass.ActivePlanController.VisualState = function() {
};
// Used as a State Object.
BusPass.ActivePlanController.VisualState.prototype = {
    SHOW_MAP : "SHOW_MAP",
    SHOW_ROUTE : "SHOW_ROUTE",
    SHOW_VEHICLE : "SHOW_VEHICLE",
    state : "SHOW_MAP",
    nearBy : false,
    onlyActive : false,
    selectedRoutes : null,
    selectedRouteCode : null,
    selectedRouteCodes : []
};

BusPass.ActivePlanController.prototype = {
    /**
     * Attribute: scope
     * This attribute is the context for the callbacks.
     */
    scope : null,
    
    onStateChanged : function (oldstate,newstate,direction) {},
    
    mapView : function (jq) {
        this._mapViewC.mapView(jq);
    },
    
    listView : function (jq) {
        this._listViewC.listView(jq);
    },
    
    controlView : function (jq) {
        this._controlViewC.controlView(jq);
    },
    
    addRoute : function(route) {
        this._routes.push(route);
        this._listViewC.addRoute(route);
        this._mapViewC.addRoute(route);
        this._updateActiveJourneys();
        
        this._setVisibility(this._stateStack[0], route);
        this._mapViewC.redraw();
        this._listViewC.redraw();
    },
    
    removeRoute : function(route) {
        var rs = [];
        for(r in this._routes) {
            if (this._routes[r] != route) {
                rs.push(this._routes[r]);
            };
        }
        this._updateActiveJourneys();
        this._listViewC.removeRoute(route);
        this._mapViewC.removeRoute(route);
    },
    
    // For testing rightnow
    back : function () {
        oldState = this._stateStack[0];
        if (this._stateStack.length > 1) {
            // pop
            this._stateStack.splice(0,1);
            for(var i = 0; i < this._routes.length; i++) {
                var route = this._routes[i];
                this._setVisibility(this._stateStack[0], route);
            }
            this._mapViewC.redraw();
            this.onStateChanged(oldState, this._stateStack[0], "BACKWARD");
        }
    },
    
    _onMapRouteSelect : function(route) {
        var state = this._stateStack[0];
        var newState = new BusPass.ActivePlanController.VisualState();
        
        switch (state.state) {
            case state.SHOW_MAP:
                // In the Android App, we select all routes under the mouse. 
                // I'm not sure I can do that with the map features yet.
                // So, for now, selection only gets one route. So, we go
                // to SHOW_ROUTE.
                newState.state = newState.SHOW_ROUTE;
                newState.selectedRouteCode = route.getCode();
                newState.selectedRouteCodes = [route.getCode()];
                newState.selectedRoutes = null;
                
                this._mapViewC.unselectRouteNoTrigger(route);
                this._listViewC.unselectRouteNoTrigger(route);
                for(var i = 0; i < this._routes.length; i++) {
                    var route = this._routes[i];
                    this._setVisibility(newState, route);
                }
                this._stateStack.splice(0,0,newState);
                this.onStateChanged(state,newState, "FORWARD");
                break;
            case state.SHOW_ROUTE:
                if (route.isActiveJourney()) {
                    newState.state = newState.SHOW_VEHICLE;
                    newState.selectedRouteCode = route.getCode();
                    newState.selectedRouteCodes = [route.getCode()];
                    newState.selectedRoutes = [route];
                    
                    this._mapViewC.unselectRouteNoTrigger(route);
                    this._listViewC.unselectRouteNoTrigger(route);
                    for(var i = 0; i < this._routes.length; i++) {
                        var route = this._routes[i];
                        this._setVisibility(newState, route);
                    }
                    this._stateStack.splice(0,0,newState);
                    this.onStateChanged(state,newState, "FORWARD");
                }
                break;
            case state.SHOW_VEHICLE:
                this._mapViewC.unselectRouteNoTrigger(route);
                this._listViewC.unselectRouteNoTrigger(route);
                break;
        }
    },
    
    _onListRouteClicked : function(ctrl, route) {
        var state = this._stateStack[0];
        var newState = new BusPass.ActivePlanController.VisualState();
        
        switch (state.state) {
            case state.SHOW_MAP:
                newState.state = newState.SHOW_ROUTE;
                newState.selectedRouteCode = route.getCode();
                newState.selectedRouteCodes = [route.getCode()];
                newState.selectedRoutes = null;
                
                this._mapViewC.unselectRouteNoTrigger(route);
                this._listViewC.unselectRouteNoTrigger(route);
                for(var i = 0; i < this._routes.length; i++) {
                    var route = this._routes[i];
                    this._setVisibility(newState, route);
                }
                this._stateStack.splice(0,0,newState);
                this._mapViewC.redraw();
                this.onStateChanged(state,newState, "FORWARD");
                break;
            case state.SHOW_ROUTE:
                // If we click on a Route Definition we do nothing.
                if (route.isActiveJourney()) {
                    newState.state = newState.SHOW_VEHICLE;
                    newState.selectedRouteCode = route.getCode();
                    newState.selectedRouteCodes = [route.getCode()];
                    newState.selectedRoutes = [route];
                    for(var i = 0; i < this._routes.length; i++) {
                        var route = this._routes[i];
                        this._setVisibility(newState, route);
                    }
                    this._stateStack.splice(0,0,newState);
                    this._mapViewC.redraw();
                    this.onStateChanged(state,newState, "FORWARD");
                }
                break;
            case state.SHOW_VEHICLE:
                this._mapViewC.redraw();
                //this._listViewC.redraw();
                break;
        }
    },
    
    _onMapRouteHighlight : function(route) {
        this._listViewC.highlightRouteNoTrigger(route);
    },
    
    _onListRouteHighlight : function(route) {
        this._mapViewC.highlightRouteNoTrigger(route);
    },
    
    _onMapRouteunhighlight : function(route) {
        this._listViewC.unhighlightRouteNoTrigger(route);
    },
    
    _onListRouteUnhighlight : function(route) {
        this._mapViewC.unhighlightRouteNoTrigger(route);
    },
    
    getCurrentLocation : function() {
        return this._currentLocation;
    },
    
    getNearbyDistance : function () {
        return this._nearbyDistance;
    },
    
    // Of VisualState objects
    _stateStack : [],
    
    // This sets the visibility of the route according to the given state.
    _setVisibility : function(state, display) {
        console.log("setVisibility: state " + state.state + " nearby " + state.nearBy + " active: " + state.onlyActive + " code " + state.selectedRouteCode + " name: " + display.getDisplayName());
        if (state.nearBy && !display.isNearRoute(this.getCurrentLocation(), this.nearbyDistance())) {
            this._listViewC.setVisibility(display, false);
            this._mapViewC.setVisibility(display, false);
            return true;
        }
        switch (state.state){
            case state.SHOW_MAP:
                if(state.selectedRoutes == null ||
                    state.selectedRoutes.indexOf(display) != -1 ||
                    state.selectedRouteCodes.indexOf(display.getCode()) != -1) {
                    // We are in general mode, so we only show the Names of Route Definitions,
                    // and Active journeys, but we don't show the Active Journey names.
                    if (display.isRouteDefinition()) {
                        if (state.onlyActive) {
                            this._listViewC.setVisibility(display, display.hasActiveJourneys());
                            this._mapViewC.setVisibility(display, display.hasActiveJourneys());
                        } else {
                            this._listViewC.setVisibility(display, true);
                            this._mapViewC.setVisibility(display, true);
                        }
                    } else {
                        // Only show Paths of Active Routes with current locations.
                        this._listViewC.setVisibility(display, false); // Don't show the bus name
                        this._mapViewC.setVisibility(display, false);
                    }
                } else {
                    this._listViewC.setVisibility(display, false);
                    this._mapViewC.setVisibility(display, false);
                }
                break;
            case state.SHOW_ROUTE:
                if (state.selectedRouteCodes.indexOf(display.getCode()) != -1) {
                    if (display.isRouteDefinition()) {
                        if (state.onlyActive) {
                            this._listViewC.setVisibility(display, display.hasActiveJourneys());
                            this._mapViewC.setVisibility(display, display.hasActiveJourneys());
                        } else {
                            this._listViewC.setVisibility(display, true);
                            this._mapViewC.setVisibility(display, true);
                        }
                    } else {
                        // Only show Paths of Active Routes with current locations.
                        this._listViewC.setVisibility(display, true); 
                        this._mapViewC.setVisibility(display, true);
                    }
                } else {
                    this._listViewC.setVisibility(display, false);
                    this._mapViewC.setVisibility(display, false);
                }
                break;
            case state.SHOW_VEHICLE:
                if (!display.isJourney()) {
                    this._listViewC.setVisibility(display, false);
                    this._mapViewC.setVisibility(display, false);
                }
                if (state.selectedRoutes.indexOf(display) != -1) {
                    // Assume it's route map is displayed.
                    this._listViewC.setVisibility(display, true);
                    this._mapViewC.setVisibility(display, true);
                }
                break;
        }
        console.log("     setVisibility --> name: " + display.isNameVisible() + " path " + display.isPathVisible());
        return true;
    },
    
    /**
     * Method: private _updateActiveJourneys
     * This method is used to update the active journeys attribute
     * on routes, due to some active journeys being added or removed.
     */
    _updateActiveJourneys : function() {
        console.log("routesView" + "resetRoutesView");
        var routes = this._routes;
        
        for(var i = 0; i < routes.length; i++) { 
            var journey = routes[i];
            if (journey.isRouteDefinition()) {
                journey.setHasActiveJourneys(false);
                for(var ji = 0; ji < routes.length; ji++) {
                    var jd = routes[ji];
                    if (jd.isActiveJourney() && jd.getCode() == journey.getCode()) {
                        journey.setHasActiveJourneys(true);
                        break;
                    }
                }
            }
        }
    },
    _routeSelected : function(route) {
        var ctrl = this;
        console.log("onLongCLick for " + route.getName() + " " +route.getId() + " State " + ctrl._stateStack[0].state);
        var newState = new BusPass.ActivePlanController.VisualState(); // here because of silly switch statement scoping anomaly
        var currentState = ctrl._stateStack[0];
        switch(currentState.state) {
            
            case currentState.SHOW_MAP:
                //assert journeyDisplay.isRouteDefinition();
                
                newState.selectedRoutes = []; //new ArrayList<JourneyDisplay>();
                //for(JourneyDisplay display : journeyBasketController.getJourneyDisplays()) {
                    var displays = ctrl._routes;
                    for(var i = 0; i < displays.length; i++) { var display = displays[i];
                    if (display.getCode() == route.getCode()) {
                        newState.selectedRoutes.push(display);
                    }
                    }
                    newState.state = newState.SHOW_ROUTE;
                    newState.selectedRouteCode = route.getCode();
                    newState.selectedRouteCodes.push(newState.selectedRouteCode);
                    // Push on front
                    ctrl._stateStack.splice(0,0,newState);
                    break;
                    
            case currentState.SHOW_ROUTE:
                if (route.isRouteDefinition()) {
                    // we may have gotten some new active journeys in the basket.
                    //for(JourneyDisplay display : journeyBasketController.getJourneyDisplays()) {
                        var displays = ctrl._routes;
                        for(var i = 0; i < displays.length; i++) { var display = displays[i];
                        if (display.getCode() == route.getCode()) {
                            if (display.isActiveJourney()) {
                                currentState.selectedRoutes.push(display);
                            }
                        }
                        }
                } else {
                    newState.selectedRoutes = []; // new ArrayList<JourneyDisplay>();
                    // find the route definition so we can display its name in the Routes View.
                    //for(JourneyDisplay display : journeyBasketController.getJourneyDisplays()) {
                        var displays = ctrl._routes;
                        for(var i = 0; i < displays.length; i++) { var display = displays[i];
                        if (display.getCode() == route.getCode()) {
                            if (display.isRouteDefinition()) {
                                newState.selectedRoutes.push(display);
                            }
                        }
                        }
                        newState.selectedRoutes.push(route);
                        newState.state = newState.SHOW_VEHICLE;
                        // push on front
                        ctrl._stateStack.splice(0,0,newState);
                        //                         passengerMapView.setTrackingJourneyDisplay(route);
                        //                         passengerMapView.animateToRouteDisplayLocation(route);
                        //                         passengerMapView.invalidate();
                }
                break;
                
            case currentState.SHOW_VEHICLE:
                if (route.isRouteDefinition()) {
                    // we may have gotten some new active journeys in the basket.
                    newState.selectedRoutes = []; // new ArrayList<JourneyDisplay>();
                    //for(JourneyDisplay display : journeyBasketController.getJourneyDisplays()) {
                        var displays = ctrl._routes;
                        for(var i in displays) { var display = displays[i];
                        if (display.getCode() == route.getCode()) {
                            if (display.isActiveJourney()) {
                                newState.selectedRoutes.push(display);
                            }
                        }
                        }
                        newState.selectedRoutes.push(route);
                        newState.state = newState.SHOW_ROUTE;
                        newState.selectedRouteCode = route.getCode();
                        newState.selectedRouteCodes.push(newState.selectedRouteCode);
                        // push on front
                        ctrl._stateStack.splice(0,0,newState);
                        //                         passengerMapView.getController().animateTo(journeyDisplay.getRoute().getZoomCenter());
                        //                         passengerMapView.getController().zoomToSpan(journeyDisplay.getRoute().getLatitudeSpanE6(),
                        //                                                                     journeyDisplay.getRoute().getLongitudeSpanE6());
                        //                         passengerMapView.unsetTracking();
                        //                         passengerMapView.unsetHighlight();
                } else {
                    //                         passengerMapView.getController().animateTo(journeyDisplay.getRoute().getZoomCenter());
                    //                         passengerMapView.getController().zoomToSpan(journeyDisplay.getRoute().getLatitudeSpanE6(),
                    //                                                                     journeyDisplay.getRoute().getLongitudeSpanE6());
                }
                //                     passengerMapView.invalidate();
                break;
        }
        console.log("MySelectListener: " + "Reseting Routes View ****************");
        ctrl._setVisibility(ctrl._stateStack[0], route);
        //ctrl._resetRoutesView();
        //passengerMapView.invalidate();
        return true;
    },

};
