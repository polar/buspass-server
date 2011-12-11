class WebmapController < ApplicationController
  layout "webmap"
  
  def index
  end
  
  def route
    @object ||= Route.find_by_persistentid(params[:id])
    
    data =  getRouteGeoJSON(@object)
    respond_to do |format|
      format.json { render :json => data }
    end
  end
  
 private

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
