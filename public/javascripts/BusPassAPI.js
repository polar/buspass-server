/**
 * BusPassAPI.js
 */
BusPassAPI = Class.create();

BusPassAPI.prototype = {
    apiMap : {},
    hostUrl : "http://localhost:3000/",

    initialize : function(url) {
        this.hosturl = url;
        this.apiMap.minorVersion = "1";
        this.apiMap.majorVersion = "0";
        
        this.apiMap["getRouteJourneyIds"] = url + "/webmap/route_journeys.text";
        this.apiMap["getRouteDefinition"] = url + "/webmap/route_journey/";
        this.apiMap["getJourneyLocation"] = url + "/webmap/curloc/";
    },

    _loggedIn : false,
    
    isLoggedIn : function() {
        return this._loggedIn;
    },
    
    login : function(cb) {
        this.updateAPIMap( cb );
    },
    name : "BuspassAPI",
    _onAPIResponse : function(http, cb) {
       var callback = function (event) {
          alert( event + "\n" + http.readyState + "." + http.status + "//" + http.responseText);
          if (http.readyState == 4) {
            if (http.status == 200) {
                var apiXML = http.responseXML;
                this._loadAPIMap(apiXML);
                this._loggedIn = true;
                cb(this,true);
            } else {
                cb(this,false);
            };
          };
        };
        return callback.bind(this);
    },
    
    load : function(xml) {
        this._loadAPIMap(xml);
    },
    
    _loadAPIMap : function(xml) {
        doc = xml.getElementsByTagName("API")[0];
        this.apiMap["getRouteJourneyIds"] = doc.getAttribute("getRouteJourneyIds");
        this.apiMap["getRouteDefinition"] = doc.getAttribute("getRouteDefinition");
        this.apiMap["getJourneyLocation"] = doc.getAttribute("getJourneyLocation");
    },
    
    updateAPIMap : function(cb) {
        var http = new XMLHttpRequest();
        http.onreadystatechange = this._onAPIResponse(http, cb);
        http.open("GET", this.hostUrl + "apis/get_api.xml?majorVersion=1&minorVersion=0", true);
        http.send();
    },
    
    getRouteJourneyIds : function() {
        return this.apiMap["getRouteJourneyIds"];
    },
    
    getRouteDefinition : function() {
        return this.apiMap["getRouteDefinition"];
    },
    
    getJourneyLocation : function() {
        return this.apiMap["getJourneyLocation"];
    },
};