class PassController < ApplicationController
  include AuthenticatedSystem

  CONTROLLER_URL = "http://adiron.kicks-ass.net:3000"

  before_filter :login_required
  before_filter :start_stats

  after_filter :end_stats


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

    text = ""
    text << @journey_locations.map {|x| getJourneySpecText(x.vehicle_journey,x.route)}.join("\n")
    if !text.empty?
      text << "\n"
    end
    text << @routes.map {|x| getRouteSpecText(x)}.join("\n")

    respond_to do |format|
      format.html { render :nothing, :status => 403 } #forbidden
      format.text { render :text => text }
    end
  end

  def route_journey
    @object   = params[:type] == "V" &&
                 VehicleJourney.find_by_persistentid(params[:id], :include => "service")
    @object ||= params[:type] == "R" &&
                 Route.find_by_persistentid(params[:id])
    # We are only really lax here if we are typing things in.
    @object ||= VehicleJourney.find_by_persistentid(params[:id], :include => "service")
    @object ||= Route.find_by_persistentid(params[:id])

    respond_to do |format|
      format.html { render :nothing, :status => 403 } #forbidden
      format.xml  { render :text => @definition = getDefinitionXML(@object) }
      format.text { render :text => @definition = getDefinitionText(@object) }
    end
  end

  def curloc
    @vehicle_journey = VehicleJourney.find_by_persistentid(params[:id]);

    if @vehicle_journey != nil && @vehicle_journey.journey_location != nil
      reported  = @vehicle_journey.journey_location.reported_time.to_i
      recorded  = @vehicle_journey.journey_location.recorded_time.to_i

      lon, lat  = @vehicle_journey.journey_location.coordinates
      timediff  = @vehicle_journey.journey_location.timediff.to_i
      direction = @vehicle_journey.journey_location.direction
      distance  = @vehicle_journey.journey_location.distance
      on_route  = @vehicle_journey.journey_location.on_route?
    end

    respond_to do |format|
      format.html { render :nothing, :status => 403 } #forbidden
      format.text {
        if @vehicle_journey == nil
          render :nothing, :status => 505 # not found
        end
        if @vehicle_journey.journey_location == nil
          render :text => "#{params[:id]},!\n"
        else
          render :text =>
            "#{params[:id]},#{(lon*1e6).to_i},#{(lat*1e6).to_i},#{reported},#{recorded},#{timediff},#{direction},#{distance},#{onroute}\n"
        end
      }
      format.xml  {
        if @vehicle_journey == nil
          render :nothing, :status => 505
        end
        if @vehicle_journey.journey_location == nil
          render :xml => "<NotInService id='#{params[:id]}'/>"
        else
          render :xml => "<JP id='#{params[:id]}' lon='#{lon}' lat='#{lat}' reported_time='#{reported}' recorded_time='#{recorded}' timediff='#{timediff}' direction='#{direction}' distance='#{distance}' onroute='#{on_route}'/>"
        end
      }
    end
  end

  private

  def getDefinitionText(route_journey)
    if (route_journey.is_a? Route)
      getRouteDefinitionText(route_journey)
    elsif (route_journey.is_a? VehicleJourney)
      getJourneyDefinitionText(route_journey)
    else
      nil
    end
  end

  def getDefinitionXML(route_journey)
    if (route_journey.is_a? Route)
      getRouteDefinitionXML(route_journey)
    elsif (route_journey.is_a VehicleJourney)
      getJourneyDefinitionXML(route_journey)
    else
      nil
    end
  end

  def getRouteSpecText(route)
    "#{route.name.tr(",","_")},#{route.persistentid},R,#{route.version}"
  end

  def getRouteSpecXML(route)
    text  = "<RouteSpec type='route'\n"
    text +=            "id='#{route.persistentid}'\n"
    text +=            "name='#{route.display_name}'\n"
    text +=            "version='#{route.version}'\n"
    text += "/>"
  end

  def getJourneySpecText(journey, route)
    "#{journey.display_name.tr(",","_")},#{journey.persistentid},V,#{route.persistentid},#{route.version}"
  end

  def getJourneySpecXML(journey, route)
    text  = "<RouteSpec type='journey'\n"
    text +=            "id='#{route.persistentid}'\n"
    text +=            "name='#{route.display_name}'\n"
    text +=            "route='#{route.persistentid}'\n"
    text +=            "version='#{route.version}'\n"
    text += "/>"
  end

  def getRouteDefinitionXML(route)
    box = route.theBox # [[nw_lon,nw_lat],[se_lon,se_lat]]

    text = "<Route type='route'\n"
    text +=        "id='#{route.persistentid}'\n"
    text +=        "name='#{route.display_name}'\n"
    text +=        "routeCode='#{route.code}'\n"
    text +=        "version='#{route.version}'\n"
    text +=        "nw_lon='#{box[0][0]}'\n"
    text +=        "nw_lat='#{box[0][1]}'\n"
    text +=        "se_lon='#{box[1][0]}'\n"
    text +=        "se_lat='#{box[1][1]}'>\n"

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

    for coords in cs do
      text += "<JPs>"
      text += coords.map{|lon,lat| "<JP lon='#{lon}' lat='#{lat}' time=''/>\n"}.join
      text += "</JPs>\n"
    end
    text += "</Route>\n"
    return text
  end

  def getRouteDefinitionText(route)
    box = route.theBox # [[nw_lon,nw_lat],[se_lon,se_lat]]
    text = "R,"
    text += "#{route.persistentid},"
    text += "#{route.version},"
    text += "#{route.display_name.tr(",","_")},"
    text += "#{(box[0][0]*1e6).to_i},"
    text += "#{(box[0][1]*1e6).to_i},"
    text += "#{(box[1][0]*1e6).to_i},"
    text += "#{(box[1][1]*1e6).to_i}"

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
    for coords in cs do
      text += "\n"
      text += coords.map{|lon,lat| "#{(lon*1e6).to_i},#{(lat*1e6).to_i},"}.join
    end
    return text
  end

  def getJourneyDefinitionText(vehicle_journey)
    box = vehicle_journey.journey_pattern.theBox
    text = "J,"
    text += "#{vehicle_journey.persistentid},"
    text += "#{vehicle_journey.service.route.version},"
    text += "#{vehicle_journey.display_name.tr(",","_")},"
    text += "#{(box[0][0]*1e6).to_i},"
    text += "#{(box[0][1]*1e6).to_i},"
    text += "#{(box[1][0]*1e6).to_i},"
    text += "#{(box[1][1]*1e6).to_i},"
    text += "10,"
    text += "#{(Time.parse("0:00")+vehicle_journey.start_time.minutes).to_i},"
    text += "#{(Time.parse("0:00")+vehicle_journey.end_time.minutes).to_i}"
    text += "\n"
    text += coords.map{|lon,lat| "#{(lon*1e6).to_i},#{(lat*1e6).to_i},"}.join
    return text
  end

  def getJourneyDefinitionXML(vehicle_journey)
    box = vehicle_journey.journey_pattern.theBox

    coords = vehicle_journey.journey_pattern.view_path_coordinates["LonLat"]
    text = "<Route type='journey'\n"
    text += "      id='#{vehicle_journey.persistentid}'\n"
    text += "      routeCode='#{vehicle_journey.service.route.code}'\n"
    text += "      version='#{vehicle_journey.service.route.version}'\n"
    text += "      name='#{vehicle_journey.display_name}'\n"
    text += "      startTime='#{(Time.parse("0:00")+vehicle_journey.start_time.minutes).to_i}'\n"
    text += "      endTime='#{(Time.parse("0:00")+vehicle_journey.end_time.minutes).to_i}'\n"
    text += "      locationRefreshRate='10'\n"
    text += "      nw_lon='#{box[0][0]}'\n"
    text += "      nw_lat='#{box[0][1]}'\n"
    text += "      se_lon='#{box[1][0]}'\n"
    text += "      se_lat='#{box[1][1]}'>\n"
    text += "<JPs>"
    text += coords.map{|lon,lat| "<JP lon='#{lon}' lat='#{lat}' time=''/>\n"}.join
    text += "</JPs>\n"
    text += "</Route>\n"
    return text
  end


end
