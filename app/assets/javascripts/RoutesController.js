BusPass.RoutesController = function(listJQ,mapJQ) {
    this._routes = [];

    this._mapViewC = new BusPass.MapViewController({
        scope : this,
        onRouteSelected : this._onMapRouteSelect,
        onRouteUnselected : this._onMapRouteUnselect,
        onRouteHighlighted : this._onMapRouteHighlight,
        onRouteUnhighlighted : this._onMapRouteunhighlight
    });
    this._listViewC = new BusPass.ListViewController({
        scope : this,
        onRouteSelected : this._onListRouteSelect,
        onRouteUnselected : this._onListRouteUnselect,
        onRouteHighlighted : this._onListRouteHighlight,
        onRouteUnhighlighted : this._onListRouteUnhighlight
    });

    // The views will be in the DOM.
    this._mapViewC.mapView(mapJQ);
    this._listViewC.listView(listJQ);
};

BusPass.RoutesController.prototype = {
    addRoute : function(route) {
        this._routes.push(route);
        this._listViewC.addRoute(route);
        this._mapViewC.addRoute(route);
    },

    removeRoute : function(route) {
        var rs = [];
        for(r in this._routes) {
        if (this._routes[r] != route) {
            rs += this._routes[r];
        };
        }
        this._listViewC.removeRoute(route);
        this._mapViewC.removeRoute(route);
    },

    selectRoute : function(route) {
        this._listViewC.unselectAllRoutesNoTrigger();
        this._mapViewC.unselectAllRoutesNoTrigger();
        this._listViewC.selectRouteNoTrigger(route);
        this._mapViewC.selectRouteNoTrigger(route);
    },

    unselectRoute : function(route) {
        this._listViewC.unselectRouteNoTrigger(route);
        this._mapViewC.unselectRouteNoTrigger(route);
    },

    highlightRoute : function(route) {
        this._listViewC.highlightRouteNoTrigger(route);
        this._mapViewC.highlightRouteNoTrigger(route);
    },

    unhighlightRoute : function(route) {
        this._listViewC.unhighlightRouteNoTrigger(route);
        this._mapViewC.unhighlightRouteNoTrigger(route);
    },

    _onMapRouteSelect : function(route) {
        this._listViewC.selectRouteNoTrigger(route);
    },

    _onListRouteSelect : function(route) {
        this._mapViewC.selectRouteNoTrigger(route);
    },

    _onMapRouteUnselect : function(route) {
        this._listViewC.unselectRouteNoTrigger(route);
    },

    _onListRouteUnselect : function(route) {
        this._mapViewC.unselectRouteNoTrigger(route);
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

    VisualState : function() {
    },

    VisualState.prototype : {
        SHOW_MAP : "SHOW_MAP",
        SHOW_ROUTE : "SHOW_ROUTE",
        SHOW_VEHICLE : "SHOW_VEHICLE",
        state : "SHOW_MAP",
        nearBy : false,
        onlyActive : false,
        selectedRoutes : null,
        selectedRouteCode : null,
        selectedRouteCodes : []
    },

    stateStack : [],

    _setVisibility : function(state, display) {
        console.log("setVisibiity: nearby" + state.nearBy + " active: " + state.onlyActive + " name: " + display.getDisplayName());
        if (state.nearBy && !display.getRoute().isNearRoute(passengerMapView.getMyLocation(), this.nearbyDistance)) {
            display.setNameVisible(false);
            display.setPathVisible(false);
            return true;
        }
        switch (state.state){
            case VisualState.SHOW_MAP:
                if(state.selectedRoutes == null ||
                    state.selectedRoutes.indexOf(display) != -1 ||
                    state.selectedRouteCodes.indexOf(display.getRoute().getCode()) != -1) {
                    // We are in general mode, so we only show the Names of Route Definitions,
                    // and Active journeys, but we don't show the Active Journey names.
                    if (display.getRoute().isRouteDefinition()) {
                        if (state.onlyActive) {
                            display.setNameVisible(display.isHasActiveJourneys());
                            display.setPathVisible(display.isHasActiveJourneys());
                        } else {
                            display.setNameVisible(true);
                            display.setPathVisible(true);
                        }
                    } else if (display.getRoute().isActiveJourney()) {
                        // Only show Paths of Active Routes with current locations.
                        display.setNameVisible(false); // Don't show the bus name
                        display.setPathVisible(true);
                    }
                    } else {
                        display.setNameVisible(false);
                        display.setPathVisible(false);
                    }
                    break;
            case VisualState.SHOW_ROUTE:
                if (state.selectedRouteCodes.indexOf(display.getRoute().getCode()) != -1) {
                    if (display.getRoute().isRouteDefinition()) {
                        if (state.onlyActive) {
                            display.setNameVisible(display.isHasActiveJourneys());
                            display.setPathVisible(display.isHasActiveJourneys());
                        } else {
                            display.setNameVisible(true);
                            display.setPathVisible(true);
                        }
                    } else if (display.getRoute().isActiveJourney()) {
                        // Only show Paths of Active Routes with current locations.
                        display.setNameVisible(true); // Don't show the bus name
                        display.setPathVisible(true);
                    }
                } else {
                    display.setNameVisible(false);
                    display.setPathVisible(false);
                }
                break;
            case VisualState.SHOW_VEHICLE:
                if (!display.getRoute().isActiveJourney()) {
                    display.setNameVisible(false);
                    display.setPathVisible(false);
                }
                if (state.selectedRoutes.indexOf(display) != -1) {
                    // Assume it's route map is displayed.
                    display.setNameVisible(true);
                    display.setPathVisible(true);
                }
                break;
        }
        console.log("setVisibiity: name: " + display.getDisplayName() + "name " + display.isNameVisible() + " path " + display.isPathVisible());
        return true;
    }

    _resetRoutesView : function(routes) {
        console.log("routesView" + "resetRoutesView");
        var routesView = this._listViewC;
        var passengerMapView = this._mapViewC;

        routesView.clearRouteList();
        //for(JourneyDisplay journey : routes) {
        for(var i in routes) { var journey = routes[i];
            if(journey.isNameVisible()) {
                //MyClickListener lis = new MyClickListener(journey);
                var lis = null // TODO: need to add MyClickListener
                routesView.addRoute(journey, lis, lis);
                if (journey == passengerMapView.getHighlightJourneyDisplay()) {
                    journey.setNameHighlighted(true);
                    // TODO: Get the highlight unset
                }
                if (journey.getRoute().isRouteDefinition()) {
                    // Check to see if there are any active journeys for it
                    journey.setHasActiveJourneys(false);
                    //for (JourneyDisplay jd : routes) {
                    for(ji in routes) { var jd = routes[ji];
                        if (jd.getRoute().isActiveJourney() &&
                            //jd.getRoute().getCode().equals(journey.getRoute().getCode())) {
                            jd.getRoute().getCode() == journey.getRoute().getCode()) {
                            journey.setHasActiveJourneys(true);
                        break;
                            }
                    }
                }
            }
        }
        //routesView.invalidate();
    },

    MyClickListener : function(jd,controller) {
        var journeyDisplay = jd;
        var ctrl = controller;
    },

    MyClickListener.prototype = {

        onLongClick : function(v) {
            console.log "onLongCLick for " + journeyDisplay.getRoute().getId());
            var newState = new BusPass.RoutesController.VisualState(); // here because of silly switch statement scoping anomaly
            var currentState = ctrl.stateStack[0];
            switch(currentState.state) {

                case currentState.SHOW_MAP:
                    //assert journeyDisplay.getRoute().isRouteDefinition();

                    newState.selectedRoutes = []; //new ArrayList<JourneyDisplay>();
                    //for(JourneyDisplay display : journeyBasketController.getJourneyDisplays()) {
                    var displays = ctrl.journeyBasketController.getJourneyDisplays();
                    for(var i in displays) { var display = displays[i];
                        if (display.getRoute().getCode() == journeyDisplay.getRoute().getCode()) {
                            newState.selectedRoutes.push(display);
                        }
                    }
                    newState.state = newState.SHOW_ROUTE;
                    newState.selectedRouteCode = journeyDisplay.getRoute().getCode();
                    newState.selectedRouteCodes.push(newState.selectedRouteCode);
                    stateStack.splice(0,0,newState);
//                     passengerMapView.getController().animateTo(journeyDisplay.getRoute().getZoomCenter());
//                     passengerMapView.getController().zoomToSpan(journeyDisplay.getRoute().getLatitudeSpanE6(),
//                                                                 journeyDisplay.getRoute().getLongitudeSpanE6());
//                     passengerMapView.unsetTracking();
//                     passengerMapView.unsetHighlight();
                    break;

                case SHOW_ROUTE:
                    if (journeyDisplay.getRoute().isRouteDefinition()) {
                        // we may have gotten some new active journeys in the basket.
                        //for(JourneyDisplay display : journeyBasketController.getJourneyDisplays()) {
                        var displays = ctrl.journeyBasketController.getJourneyDisplays();
                        for(var i in displays) { var display = displays[i];
                            if (display.getRoute().getCode( == journeyDisplay.getRoute().getCode()) {
                                if (display.getRoute().isActiveJourney()) {
                                    currentState.selectedRoutes.push(display);
                                }
                            }
                        }
//                         passengerMapView.getController().animateTo(journeyDisplay.getRoute().getZoomCenter());
//                         passengerMapView.getController().zoomToSpan(journeyDisplay.getRoute().getLatitudeSpanE6(),
//                                                                     journeyDisplay.getRoute().getLongitudeSpanE6());
//                         passengerMapView.unsetTracking();
//                         passengerMapView.unsetHighlight();
                    } else {
                        //VisualState newState = new VisualState();
                        newState.selectedRoutes = []; // new ArrayList<JourneyDisplay>();
                        // find the route definition so we can display its name in the Routes View.
                        //for(JourneyDisplay display : journeyBasketController.getJourneyDisplays()) {
                        var displays = ctrl.journeyBasketController.getJourneyDisplays();
                        for(var i in displays) { var display = displays[i];
                            if (display.getRoute().getCode().equals(journeyDisplay.getRoute().getCode())) {
                                if (display.getRoute().isRouteDefinition()) {
                                    newState.selectedRoutes.push(display);
                                }
                            }
                        }
                        newState.selectedRoutes.push(journeyDisplay);
                        newState.state = VState.SHOW_VEHICLE;
                        stateStack.splice(0,0,newState);
//                         passengerMapView.setTrackingJourneyDisplay(journeyDisplay);
//                         passengerMapView.animateToRouteDisplayLocation(journeyDisplay);
//                         passengerMapView.invalidate();
                    }
                    break;

                case SHOW_VEHICLE:
                    if (journeyDisplay.getRoute().isRouteDefinition()) {
                        // we may have gotten some new active journeys in the basket.
                        newState.selectedRoutes = []; // new ArrayList<JourneyDisplay>();
                        //for(JourneyDisplay display : journeyBasketController.getJourneyDisplays()) {
                        var displays = ctrl.journeyBasketController.getJourneyDisplays();
                        for(var i in displays) { var display = displays[i];
                            if (display.getRoute().getCode() == journeyDisplay.getRoute().getCode()) {
                                if (display.getRoute().isActiveJourney()) {
                                    newState.selectedRoutes.push(display);
                                }
                            }
                        }
                        newState.selectedRoutes.push(journeyDisplay);
                        newState.state = VState.SHOW_ROUTE;
                        newState.selectedRouteCode = journeyDisplay.getRoute().getCode();
                        newState.selectedRouteCodes.add(newState.selectedRouteCode);
//                         stateStack.splice(0,0,newState);
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
            console.log("MyClickListener: " + "Reseting Routes View ****************");
            ctrl.setVisibility(stateStack.peek());
            ctrl.resetRoutesView();
            //passengerMapView.invalidate();
            return true;
        }


};
