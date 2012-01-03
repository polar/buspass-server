/**
 * @author Polar Humenn
 */
describe('BusPassAPI', function() {
    var api = null;
    
    beforeEach( function() {
        api = new BusPassAPI('http://localhost:3000/');
    });
    
    it("should be able to load map", function() {
        var url1 = "http://fakeurl1";
        var url2 = "http://fackurl2";
        var url3 = "http://fackurl3";
        var parser = new DOMParser();
        xmlDoc = parser.parseFromString(
            "<API majorVersion='1' minorVersion='1'" +
             " getRouteJourneyIds='" + url1 + "'" +
             " getRouteDefinition='" + url2 + "'" +
             " getJourneyLocation='" + url3 + "'/>",
            "text/xml");
        api.load(xmlDoc);
        expect(api.getRouteJourneyIds()).toEqual(url1);
        expect(api.getRouteDefinition()).toEqual(url2);
        expect(api.getJourneyLocation()).toEqual(url3);
    });
    
    it('should be able to login', function () {
        var called = false;
        var callback = function (api, result) {
            alert("Called " + result);
            called = true;
        };
        runs( function() {
            api.login(callback);
        });
        waitsFor(function() {
            return called;
        });
        runs( function () {
            expect(api.isLoggedIn()).toEqual(true);
        });
    });
});