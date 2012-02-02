BusPass.JourneyBasket = function (api,journeyStore) {
    this._busAPI = api;
    this._nearbyDistance = -1;
    this._journeys = [];
    this._location = [0,0];//new GeoPoint(0,0);
    this._pollTime = 60000;
    this._journeyStore = journeyStore;
    this._worker = new Worker("/assets/RouteWebWorker.js");

    var basket = this;
    this._worker.addEventListener('message', function(e) {
        var data = e.data;
        switch (data.cmd) {
            case 'loadJourneyIds':
                basket._loadJourneyIdsReturn(data);
                break;
            case 'fetchRoute':
                basket._onFetchRouteReturn(data);
                break;
            default:
                console.log("JourneyBasket: Unknown command from worker: " + data.msg);
        };
    }, false);
    this._worker.onerror = function (event) {
        console.log("JourneyBasket.worker: " + event.message, event);
    };
};

BusPass.JourneyBasket.prototype = {
    onJourneyAddedListener :  {
        onJourneyAdded : function (basket, r) {}
    },

    onJourneyRemovedListener : {
       onJourneyRemoved : function (basket, r) {}
    },

    onBasketUpdatedListener : {
        onBasketUpdated : function (basket) {}
    },

    onIOErrorListener  : {
        onIOError : function (basket, ioe) {}
    },

    progressListener : {
        onSyncStart : function () {},
        onSyncEnd : function (nRoutes) {},
        onRouteStart : function (iRoute) {},
        onRouteEnd : function (iRoute) {},
        onDone : function () {},
    },

    onIOErrorListener : {
        onIOError : function(basket, ioe) {}
    },

    setForRoute : function(routeid) {
        this._forRouteIds = [];
        this._forRouteIds.push(routeid);
    },

    setForRoutes : function(routeids) {
        this._forRouteIds = routeids;
    },

    setNearbyDistance : function(distance) {
        this._neabyDistance = distance;
    },

    setLocation : function(geoPoint) {
        this._location = geoPoint;
    },

    getNearbyDistance : function() {
        return this._neabyDistance;
    },

    getForRouteId : function () {
        return this._forRouteIds[0];
    },

    getForRouteIds : function() {
        return this._forRouteIds.splice(0);
    },

    getLocation : function () {
        return this._location;
    },

    getPollTime : function () {
        return this._pollTime;
    },

    setPollTime : function (pollTime) {
        this._pollTime = pollTime;
    },

    _init : function() {
        if (!this._busAPI.isLoggedIn()) {
            console.log("JourneyBasket.init: We are not logged on. Returning!");
            this._journeys = [];
            this.progressListener.onDone();
            return;
        }
        this.progressListener.onSyncStart();
        // This is a relatively quick call.
        this._loadJourneyIds();
    },

    _loadJourneyIds : function() {
        this._worker.postMessage( {
            cmd: "loadJourneyIds",
            apiMap: this._busAPI.apiMap,
        });
    },

    _loadJourneyIdsReturn : function(data) {
        console.log("JourneyBasket._loadJourneyIdsReturn:" + $.toJSON(data));
        var status = data.status;
        switch (status) {
            case 'Start' :
                this.progressListener.onSyncStart();
                break;
            case 'Success':
                var journeyids = data.journeyids;
                this._onJourneyIdsLoaded(journeyids);
                break;
            case 'IOError':
                this._onJourneyIdsLoadError(data.message);
                break;
            default:
                console.log("JourneyBasket: Unknown response from worker - " + data.status);
        }
    },

    _onJourneyIdsLoaded : function(journeyids) {
        this.progressListener.onSyncEnd(journeyids.length);
        this._sync(journeyids);
    },

    _onJourneyIdsLoadError : function(ioe) {
        console.log(ioe.message);
        if (this.progressListener != null) {
            this.progressListener.onSyncEnd(0);
            this.progressListener.onDone();
        }
        if (this.onIOErrorListener != null) {
            this.onIOErrorListener.onIOError(this, ioe);
        }
        if (this.progressListener != null) {
            this.progressListener.onDone();
        }
        this._updateInProgress = false;
        console.log("JourneyBasket: Error Loading JourneyIds :" + ioe.message);
    },

    _fetchRoute : function(journeyid, progress_index, end_progress_index) {
        console.log("JourneyBasket: Fetch Route "+ journeyid.name + ":" + journeyid.id + " version: " + journeyid.version);
        this._worker.postMessage( {
            cmd: "fetchRoute",
            apiMap: this._busAPI.apiMap,
            journeyid : journeyid,
            progress_index: progress_index,
            end_progress_index: end_progress_index
        });
    },

    _onFetchRouteReturn : function(data) {
        var status = data.status;
        switch (status) {
            case 'Start' :
                this.progressListener.onRouteStart(data.progress_index);
                break;
            case 'Success':
                this.progressListener.onRouteEnd(data.progress_index);
                if (data.progress_index == data.end_progress_index) {
                    this.progressListener.onDone();
                }
                var route = new Route(data.route);
                this._journeyStore.storeJourney(route);
                this.onJourneyAddedListener.onJourneyAdded(this, route);
                if (data.progress_index == data.end_progress_index) {
                    this.onBasketUpdatedListener.onBasketUpdated(this);
                }
                break;
            case 'IOError':
                break;
            default:
                console.log("JourneyBasket: Unknown response from worker - " + data.status);
        }
    },

    // This should be relatively quick.

    _sync : function(journeyids) {
        function addAll(as,xs) {
            for(var i = 0; i < xs.length; i++) {
                as.push(xs[i]);
            }
            return as;
        };

        console.log("JourneyBasket: Syncing with "+journeyids.length+" journey ids");
        var copy_journeys = this._journeys.slice(0);
        var addedJourneys = [];
        var removedJourneys = [];
        var keepJourneys = [];
        var newJourneys = [];
        var journeyidsNeeded = [];
        for (var i = 0; i < journeyids.length; i++) {
            journeyid = journeyids[i];
            if (journeyid != null) {
                var addJourney = true;
                // If we don't find it in the displayed journeys then we have to add it, or
                // if we find it, but it's outdated.
                for(var j = 0; j < copy_journeys.length; j++) {
                    r = copy_journeys[j];
                    if(r.getId() == journeyid.id) {
                        console.log("JourneyBasket: Route " + r.getId() + " " + r.getName() + " " + r.getVersion() + " ?=? " + journeyid.version);
                        if (r.getVersion() < journeyid.version) {
                            console.log("JourneyBasket: Replacing Route "+ journeyid.name + ":" + journeyid.id + " version: " + r.getVersion() + " --> " + journeyid.version);
                            addJourney = true;
                            // Remove old route from the store. It will be replaced below.
                            this._journeyStore.removeJourney(r);
                        } else {
                            addJourney = false;
                        }
                        break;
                    }
                }
                if(addJourney) {
                    var route = this._journeyStore.getJourney(journeyid.id);
                    if (route == null) {
                        console.log("JourneyBasket: Need Route "+ journeyid.name + ":" + journeyid.id + " " + journeyid.version + " = " + route);
                        journeyidsNeeded.push(journeyid);
                    } else {
                        console.log("JourneyBasket: Adding Route "+ journeyid.name + ":" + journeyid.id + " " + journeyid.version + " = " + route);
                        addedJourneys.push(route);
                    }
                }
            }
            // We look through the displayed journeys, and if we don't find its id, or
            // we do and its outdated, then we remove it from the display, because
            // we've already added it's replacement.
            for(var j = 0; j < copy_journeys.length; j++) {
                var r = copy_journeys[j];
                var removeJourney = true;
                for(var k = 0; k < journeyids.length; k++) {
                    var journeyid = journeyids[k];
                    if(r.getId() == journeyid.id) {
                        if (r.getVersion() < journeyid.version) {
                            console.log("JourneyBasket: Removing Old Route "+ journeyid.name + ":" + journeyid.id + " version: " + r.getVersion() + " --> " + journeyid.version);
                            removeJourney = true;
                            // It's already been removed from the store above.
                        } else {
                            removeJourney = false;
                        }
                        break;
                    }
                }
                if (removeJourney) {
                    removedJourneys.push(r);
                } else {
                    console.log("JourneyBasket: Keeping Route "+ r.getName() + " version: " + r.getVersion());
                    keepJourneys.push(r);
                }
            }
        }
        addAll(newJourneys, keepJourneys);
        addAll(newJourneys, addedJourneys);
        journeys = newJourneys;

        for(var i = 0; i < removedJourneys.length; i++) {
            var r = removedJourneys[i];
            this.onJourneyRemovedListener.onJourneyRemoved(this,r);
        }
        for(var i = 0; i < addedJourneys.length; i++) {
            var r = addedJourneys[i];
            this.onJourneyAddedListener.onJourneyAdded(this,r);
        }
        for(var i = 0; i < journeyidsNeeded.length; i++) {
            var r = journeyidsNeeded[i];
            this._fetchRoute(r, i+1, journeyidsNeeded.length);
        }
    },

    empty : function () {
        var copy_journeys = this._journeys.splice(0);
        this._journeys = [];
        for(var i = 0; i < copy_journeys.length; i++) {
            var r = copy_journeys[i];
            this.onJourneyRemovedListener.journeyRemoved(this,r);
        }
        this.onBasketUpdatedListener.onBasketUpdated(this);
    },

    onCreate : function() {
        console.log("JourneyBasket: onCreate");
        this._state = "CREATE";
    },

    onStart : function() {
        console.log("JourneyBasket: onStart");
        this._state = "START";
        // If we are starting and there is already an update
        // in progress, let it continue. Only do the init()
        // if it is not needed.
        if (!this._updateInProgress) {
            this._updateInProgress = true;
            this._init();
        }
    },

    _run : function () {
        var self = this;
        if (!this.please_stop) {
            this._init();
            this.updateInProgress = true;
            setTimeout(function () {
                self._run()
            }, this._pollTime);
        } else {
            this.updateInProgress = false;
        }
    },

    onResume : function () {
        console.log("JourneyBasket: onResume");
        this._state = "RESUME";
        this._please_stop = false;
        this._updateInProgress = true;
        var self = this;
        setTimeout(function () {
            self._run()
        }, this._pollTime);
    },

    onPause : function() {
        console.log("JourneyBasket: onPause");
        this._state = "PAUSE";
        this._please_stop = false;
    },

    onStop : function() {
        console.log("JourneyBasket: onStop");
        state = "STOP";
    },

    onRestart : function () {
        console.log("JourneyBasket: onRestart");
        this._state = "RESTART";
        // The user might have stopped the app and
        // restarted it so soon that the updates
        // didn't have a chance to quiesse. Therefore,
        // if there is an update in progress, we do
        // nothing and let it continue.  Otherwise, some
        // time may have gone by, so we just empty the
        // basket in preparation for another init.
        if (!this._updateInProgress) {
            this.empty();
            console.log("JourneyBasket: empty() ended");
        }
    },

    onDestroy : function () {
        console.log("JourneyBasket: onDestroy");
        this._state = "DESTROY";
    },

    forceSync : function(progressListener, onIOErrorListener) {
        if (this._updateInProgress) {
            this._worker.terminate();
            // TODO: Remove the Timeout for a Run here.
            this._please_stop = true;
        }
        this.progressListener = progressListener;
        this.onIOErrorListener = onIOErrorListener;
        this._init();
    }
};

