class ApisController < ApplicationController
  include AuthenticatedSystem

  CONTROLLER_URL = "http://adiron.kicks-ass.net:3000"
#  CONTROLLER_URL = "http://api.buspass.adiron.com:3000"
#  CONTROLLER_URL = "http://184.106.109.126:3000"

  before_filter :authorized_or_new_user
  before_filter :track_user
  before_filter :start_stats

  after_filter :end_stats

  # This is the login.
  def get_api
    # For now we only have one.
    @api = Api.first
    if @api == nil
      #
      # @api = Api.find_by_major_version
      # So far, we just ignore, and give them this one.
      #
      @api = Api.new
      @api.major_version = 1
      @api.minor_version = 1

      text = "<API\n"
      text += "majorVersion= '#{@api.major_version}'\n"
      text += "minorVersion= '#{@api.minor_version}'\n"
      text += "getRouteJourneyIds = '#{CONTROLLER_URL}/pass/route_journeys.text'\n"
      text += "getRouteDefinition = '#{CONTROLLER_URL}/pass/route_journey/'\n"
      text += "getJourneyLocation = '#{CONTROLLER_URL}/pass/curloc/'\n"
      text += "/>"
      @api.definition = text
   end
   respond_to do |format|
     format.html { render :nothing, :status => 403 } #forbidden
     format.xml  { render :xml => @api.definition }
   end
  end

  private

  # before_filter :authorized_or_new_user, :get_api
  def authorized_or_new_user
    if !authorized?
      logout_keeping_session!
      @current_user = User.new
      @current_user.remember_me_for(3.years)
      @current_user.save!
      send_remember_cookie!
    end
  end

  # before_filter :track_user, :get_api
  def track_user
    ut = UserTracking.new
    ut.user = @current_user
    if params[:lon] && params[:lat]
      lon = params[:lon].to_f
      lat = params[:lat].to_f
      ut.longitude = lon
      ut.latitude  = lat
    end
    ut.sessionid  = request.session_options[:id]
    ut.login_date = Time.now
    ut.save!
  end

end
