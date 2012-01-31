/**
 * BusPassAPI.js
 */
//= require jquery.json-2.3
BusPassAPI = function() {};

BusPassAPI.prototype = {
    apiMap : {},
    hostUrl : "http://localhost:3000/",

    initialize : function(url) {
        this.hosturl = url;
        this.apiMap.minorVersion = "1";
        this.apiMap.majorVersion = "0";

        this.apiMap["getRoutePath"] = url + "/webmap/route/";
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
        this.apiMap["getRoutePath"]       = doc.getAttribute("getRoutePath");
        this.apiMap["getRouteJourneyIds"] = doc.getAttribute("getRouteJourneyIds");
        this.apiMap["getRouteDefinition"] = doc.getAttribute("getRouteDefinition");
        this.apiMap["getJourneyLocation"] = doc.getAttribute("getJourneyLocation");
    },

    updateAPIMap : function(cb) {
      api = this;
      cont1 = function(result, status, third) {
        api._loadAPIMap(result);
        cb(api);
      }
      $.get(this.hostUrl + "webmap/api.xml?majorVersion=1&minorVersion=0",cont1, "xml");
    },

    getRoutePathURL : function( routeid ) {
      return this.apiMap["getRoutePath"]+"/" + routeid + ".json";
    },

    fetchRouteJourneyIds : function(successC, failureC) {
        url = this.apiMap["getRouteJourneyIds"];
        var api = this;
        function resultC(result, status, response) {
          if (status == "success") {
            if (successC != null) {
              successC(result);
            }
          } else {
            if (failureC != null) {
              failureC(response);
            }
          }
        }
        var url = this.apiMap["getRouteJourneyIds"] +".json";
        $.get(url, resultC, "json");
    },

    getRouteDefinition : function() {
        return this.apiMap["getRouteDefinition"];
    },

    getJourneyLocation : function() {
        return this.apiMap["getJourneyLocation"];
    },

    fetchRouteDefinition : function( nameid, successC, failureC ) {
      var api = this;

      // The result Continuation
      function resultC(result, status, response) {
        if (status == "success") {
          var route = new Route(api);
          $.extend(route, result);
          if (successC != null) {
            successC(route);
          }
        } else {
          if (failureC != null) {
            failureC(response);
          }
        }
      }

      var url = this.apiMap["getRouteDefinition"] + "/" + nameid.id + ".json";
      var args = "?web=1";
      if (nameid.type != null) {
        args += "&type=" + nameid.type;
      }
      $.get(url+args, resultC, "json");
    }
};