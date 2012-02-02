BusPass.JourneyStore = function () {
    this._journeys = new Hashtable();
};
// Used for serialization, which we may not do.
BusPass.JourneyStore.prototype = {

    storeJourney : function(route) {
        this._journeys.put(route.getId(),route);
    },

    getJourney : function(id) {
        route = this._journeys.get(id);
        if (route == null) {
            console.log("JourneyStore" + "getJourney("+id+") == null");
        } else {
            console.log("JourneyStore" + "getJourney("+id+") = version = "+route.getVersion()+ ", name = " + route.getName());
        }
        return route;
    },

    removeJourney : function(route) {
        this._journeys.remove(route.getId());
    },

    postSerialize : function(api) {
        var members = this._journeys.values();
        for(var i in members) {
            members[i].postSerialize(api);
        }
    },

    preSerialize : function(api) {
        var members = this._journeys.values();
        for(var i in members) {
            members[i].preSerialize(api);
        }
    }
}