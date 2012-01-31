class WebmapController < ApplicationController
  layout "webmap"

  def index
  end

  def api
    text = "<API\n"
    text += "majorVersion=" + "'1'" + "\n"
    text += "minorVersion=" + "'1'" + "\n"
    text += "getRoutePath=" + "'webmap/route'" + "\n"
    text += "getRouteJourneyIds=" + "'webmap/route_journeys'" + "\n"
    text += "getRouteDefinition=" + "'webmap/routedef'" + "\n"
    text += "getJourneyLocation=" + "'webmap/curloc/'" + "\n"
    text += "/>\n"

    respond_to do |format|
      format.xml { render :text => text }
    end
  end

  def route
    @object ||= Route.find_by_persistentid(params[:id])

    data =  getRouteGeoJSON(@object)
    respond_to do |format|
      format.json { render :json => data }
    end
  end

  def routedef
    @object ||= Route.find_by_persistentid(params[:id])

    data =  getRouteDefinitionJSON(@object)
    respond_to do |format|
      format.json { render :json => data }
    end
  end

  # We are going return two types, Routes and Active VehicleJourneys.
  def route_journeys
    @routes = Route.all
    rs = []
    if params[:routes] != nil
      rs = params[:routes].split(',')
    end
    if params[:route]
      rs << params[:route]
    end
    if !rs.empty?
      @routes.select {|x| rs.include?(x.id)}
    end

    @journey_locations = JourneyLocation.find_by_routes(@routes)

    specs = []
    specs += @journey_locations.map {|x| getJourneySpec(x.vehicle_journey,x.route)}
    specs += @routes.map {|x| getRouteSpec(x)}

    respond_to do |format|
      format.html { render :nothing, :status => 403 } #forbidden
      format.json { render :json => specs }
    end
  end

  private

  def getRouteSpec(route)
    data = {}
    data["name"] = route.name.tr(",","_")
    data["id"] = route.persistentid
    data["type"] = "R"
    data["version"] = route.version
    return data
  end

  def getRouteSpecText(route)
    "#{route.name.tr(",","_")},#{route.persistentid},R,#{route.version}"
  end

  def getJourneySpec(route)
    data = {}
    data["name"] = journey.display_name.tr(",","_")
    data["id"] = journey.persistentid
    data["type"] = "V";
    data["routeid"] = route.persistentid
    data["version"] = route.version
    return data
  end

  def getJourneySpecText(journey, route)
    "#{journey.display_name.tr(",","_")},#{journey.persistentid},V,#{route.persistentid},#{route.version}"
  end

 def getRouteDefinitionJSON(route)
   box = route.theBox # [[nw_lon,nw_lat],[se_lon,se_lat]]
   data = {}
   data[:_type]='route'
   data[:_id]="#{route.persistentid}"
   data[:_name]="#{route.display_name}"
   data[:_code]="#{route.code}"
   data[:_version]="#{route.version}"
   data[:_nw_lon]="#{box[0][0]}"
   data[:_nw_lat]="#{box[0][1]}"
   data[:_se_lon]="#{box[1][0]}"
   data[:_se_lat]="#{box[1][1]}"
   return data
 end


  def getRouteDefinitionCoords(route)
    patterns = route.journey_patterns
    # Make the patterns unique.
    cs = []
    for pattern in patterns do
      coords = pattern.view_path_coordinates["LonLat"]
      unique = true
      for c in cs do
        if coords == c
          unique = false
          break
        end
      end
      if unique
        cs << coords
      end
    end
    cs[0]
  end

  def getRouteGeoJSON(route)
    data = {
      "type" => "Feature",
      "properties" => {},
      "geometry" => {
        "type" => "LineString",
        "coordinates" => getRouteDefinitionCoords(route)
      },
      "crs" => {
        "type"=> "name",
        "properties" => {
          "name" => "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
      }
    }
    return data
  end
end
