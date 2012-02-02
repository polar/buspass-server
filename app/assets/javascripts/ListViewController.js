BusPass.ListViewController = function(options) {
    this._routes = [];
    this._selectedRoutes = [];

    $.extend(this,options);
    if (this.scope == null) {
        this.scope = this;
    }
};

BusPass.ListViewController.prototype = {
    scope : null,

    onRouteSelected : function () {},

    onRouteUnselected : function () {},

    onRouteHighlighted : function () {},

    onRouteUnhighlighted : function () {},

    listView : function(jquery) {
        this._jquery = jquery;
    },

    /**
     * Method: addRoute
     * This method adds a route to the ListView.
     */
    addRoute : function(route) {
        this._routes.push(route);
        $(this._jquery).append(this._constructRouteElement(route));
        this._sortRouteElements();
    },

    /**
     * Method: removeRoute
     * This method removes a route from the ListView
     */
    removeRoute : function(route) {
        var rs = [];
        for(r in this._routes) {
            if (this._routes[r] != route) {
                rs += this._routes[r];
            };
        }
        this._routes = rs;
        route.__element.delete();
    },

    /**
     * Method: clearRoutes
     * This method removes all routes from the ListView
     */
    clearRoutesList : function() {
        this._routes = [];
        this._redisplayRoutes();
    },

    /**
     * Method: selectRouteNoTrigger
     * This method only selects the route in this View.
     * It doesn't trigger a callback.
     */
    selectRouteNoTrigger : function(route) {
        console.log("list.selectRoutesNoTrigger: selecting " + route.getName() + ":" + route.getId());
        this.unselectAllRoutesNoTrigger();
        this._selectedRoutes.push(route);
        route.setSelected(true);
        route.__element.className = "item row route-selected";
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
     * Method: unselectRouteNoTrigger
     * This method only unselects the route in this View.
     * It doesn't trigger a callback.
     */
    unselectRouteNoTrigger : function(route) {
        console.log("list.unselectRoutesNoTrigger: unselecting " + route.getName() + ":" + route.getId());
        this._selectedRoutes = this._remove(this._selectedRoutes,route);
        route.setSelected(false);
        route.__element.className = "item row";
    },

    /**
     * Method: unselectAllRoutesNoTrigger
     * This method only unselects the routes in this View.
     * It doesn't trigger callbacks.
     */
    unselectAllRoutesNoTrigger : function() {
        console.log("list.unselectAllRoutes: unselecting ");
        var sroutes = this._selectedRoutes;
        for(i in sroutes) {
            console.log("list.unselectAllRoutes.route: unselecting " + sroutes[i].getName() + ":" + sroutes[i].getId());
            sroutes[i].setSelected(false);
            sroutes[i].__element.className = "item row";
        }
        this._selectedRoutes = [];
    },

    /**
     * Method: highlightRouteNoTrigger
     * This method only highlights the routes in this View.
     * It doesn't trigger callbacks.
     */
    highlightRouteNoTrigger : function(route) {
        console.log("list.highlightRouteNoTrigger " + route.getName() + " - " + route.isSelected());
        if (route.isSelected()) {
            route.__element.className = "item row route-selected route-highlighted";
        } else {
            route.__element.className = "item row route-highlighted";
        }
    },

    /**
     * Method: unhighlightRouteNoTrigger
     * This method only unhighlights the routes in this View.
     * It doesn't trigger callbacks.
     */
    unhighlightRouteNoTrigger : function(route) {
        console.log("list.unhighlightRouteNoTrigger " + route.getName() + " - " + route.isSelected());
        if (route.isSelected()) {
            route.__element.className = "item row route-selected";
        } else {
            route.__element.className = "item row";
        }
    },

    /**
     * Method: unhighlightAllRoutesNoTrigger
     * This method only unselects the routes in this View.
     * It doesn't trigger callbacks.
     */
    unhighlightAllRoutesNoTrigger : function() {
        for(i in this._routes) {
            this.unhighlightRouteNoTrigger(this._routes[i]);
        }
    },

    /**
     * Method: private _redisplayRoutes
     * This method reconstructs the elememnts under the RouteDisplay Element.
     */
    _redisplayRoutes : function() {
        var ctrl = this;
        $(ctrl._element).html("");
        $.each(ctrl._routes, function(i,x) {
            $(ctrl._element).append(ctrl._constructRouteElement(x)); });
    },

    /**
     * Method: private _compare
     * This method compares two elements.
     *
     * Returns:
     * {Integer} - -1, 0, 1
     */
    _compare : function (s1,s2) {
        return s1<s2?-1:s1==s2?0:1;
    },

    /**
     * Method: private _compareCodes
     * This method compares Route codes.
     * TODO: Parameterize this for muncipalities
     * Codes are compared on their route base, which is their
     * last 2 digits. The 43 has routes 143, 243, 443, 543.
     */
    _compareCodes : function (code1,code2) {
        var c1 = "   " + code1;
        var c2 = "   " + code2;
        var base1 = c1.substring(c1.length-2);
        var base2 = c2.substring(c2.length-2);
        var cmp = this._compare(base1,base2);
        if (cmp == 0) {
            // ' ' < '0'
            var s1 = c1.substring(c1.length-3,c1.length-2);
            var s2 = c2.substring(c2.length-3,c2.length-2);
            return this._compare(s1,s2);
        }
        return cmp;
    },

    /**
     * Method: private _compareRoutes
     * This method compares Routes. We always put the Route
     * atop of its Journeys. The rest are sorted by codes.
     */
    _compareRoutes : function (r1,r2) {
        if (r1.isJourney() && r2.isJourney() ||
            !r1.isJourney() && !r2.isJourney()) {
            cmp = this._compareCodes(r1.getCode(),r2.getCode());
        if (cmp == 0) {
            return this._compare(r1.getDisplayName(),r2.getDisplayName());
        } else {
            return cmp;
        }
            } else {
                if (r1.isJourney()) {
                    return -1;
                } else {
                    return 1;
                }
            }
    },
    /**
     * Method: private _compareRouteElements
     * This method is used to sort through the DOM elements for Routes.
     */
    _compareRouteElements : function(rd1,rd2) {
        return this._compareRoutes(rd1.__route, rd2.__route);
    },


    /**
     * Method: private _constructRouteElement
     * This method constructs the element for display.
     */
    _constructRouteElement : function(route) {
        var ctrl = this;
        var div =
            "<div class='item row' data-role='" + route.getType() + "' data-routeid='"+ route.getId() + "'>" +
                "<div class='span1 route-code' data-role='route-code'>" +
                    route.getCode() +
                "</div>"+
                "<div class='span5 route-name' data-role='route-name'>" +
                    route.getDisplayName() +
                "</div>" +
                "<div class='span1 route-times'>" +
                    "<div class='route-time'>" +
                    "</div>" +
                    "<div class='route-time'>" +
                    "</div>" +
                "</div>" +
            "</div>";
        // Returns array [<div>]
        div = $(div);
        // Element sorting key is the route..
        div[0].__route = route;
        route.__element = div[0];
        route.__routesView = this;
        // I don't know why this doesn't work on directly on div[0].
        div.click(function() {
            console.log("clicked on " + route.getName() + " - " + this.getAttribute("data-routeid"));
            ctrl._onRouteClick(ctrl,route);
        });
        div.mouseover(function() {
            console.log("moveover on " + route.getName() + " - " + this.getAttribute("data-routeid"));
            ctrl._onRouteMouseOver(ctrl,route);
        });
        div.mouseout(function() {
            console.log("mouseout on " + route.getName() + " - " + this.getAttribute("data-routeid"));
            ctrl._onRouteMouseOut(ctrl,route);
        });
        return div;
    },

    _sortRouteElements : function() {
        var ctrl = this;
        var children = $(ctrl._jquery).children("div");
        // TODO: We can just insert at the right place.
        children.detach().sort(
            function(a,b) {
                return ctrl._compareRouteElements(a,b);
            });
        $(ctrl._jquery).append(children);
    },

    _triggerCallback : function(cb, route) {
        cb.apply(this.scope, [route]);
    },

    _onRouteClick : function(ctrl, route) {
        console.log("onRouteClick " + route.getName() + " - " + route.isSelected());
        if (route.isSelected()) {
            ctrl.unselectRouteNoTrigger(route);
            ctrl._triggerCallback(ctrl.onRouteUnselected, route);
        } else {
            ctrl.selectRouteNoTrigger(route);
            ctrl._triggerCallback(ctrl.onRouteSelected, route);
        }
    },

    _onRouteMouseOver : function(ctrl,route) {
        console.log("_onRouteMouseOver " + route.getName() + " selected " + route.isSelected());
        ctrl.highlightRouteNoTrigger(route);
        ctrl._triggerCallback(ctrl.onRouteHighlighted, route);
    },

    _onRouteMouseOut : function(ctrl,route) {
        console.log("_onRouteMouseOut " + route.getName() + " selected " + route.isSelected());
        ctrl.unhighlightRouteNoTrigger(route);
        ctrl._triggerCallback(ctrl.onRouteUnhighlighted, route);
    },
};
