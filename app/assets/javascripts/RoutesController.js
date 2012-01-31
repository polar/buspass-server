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
        onRouteUnhighlighted : this._onListRouteunhighlight
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
};
