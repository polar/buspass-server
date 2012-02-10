/**
 * BusPassAPI.js
 *  needs jquery.hive.pollen.js
 */
BusPassAPI = function(apiMap) {
    this.apiMap = apiMap;
};

BusPassAPI.prototype = {
    apiMap : {},

    fetchRouteJourneyIds : function(successC, failureC) {
        url = this.apiMap["getRouteJourneyIds"];
        var api = this;
        function resultC(result) {
            // I think this. is the request
            if (this.status == 200) {
                if (successC != null) {
                    successC(result);
                }
            } else {
                if (failureC != null) {
                    failureC(this.responseText);
                }
            }
        }
        var url = this.apiMap["getRouteJourneyIds"] +".json";
        $.ajax.get( { url: url, success: resultC, dataType: "json" });
    },


    fetchRouteDefinitionData : function( nameid, successC, failureC ) {
        var api = this;
        function resultC(result) {
            // I think this. is the request
            if (this.status == 200) {
                if (successC != null) {
                    successC(result);
                }
            } else {
                if (failureC != null) {
                    failureC(this.responseText);
                }
            }
        }
        var url = this.apiMap["getRouteDefinition"] + "/" + nameid.id + ".json";
        args = "";
        if (nameid.type != null) {
            args += "?type=" + nameid.type;
        }
        $.ajax.get( { url: url+args, success: resultC, dataType: "json"});
    },

    fetchCurrentLocationData : function( nameid, successC, failureC ) {
        var api = this;
        function resultC(result) {
            // I think this. is the request
            if (this.status == 200) {
                if (successC != null) {
                    successC(result);
                }
            } else {
                if (failureC != null) {
                    failureC(this.responseText);
                }
            }
        }
        var url = this.apiMap["getJourneyLocation"] + "/" + nameid.id + ".json";
        args = "";
        if (nameid.type != null) {
            args += "?type=" + nameid.type;
        }
        $.ajax.get( { url: url+args, success: resultC, dataType: "json"});
    }
};