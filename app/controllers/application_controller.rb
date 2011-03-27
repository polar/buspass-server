# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  helper :all # include all helpers, all the time
  protect_from_forgery # See ActionController::RequestForgeryProtection for details

  # Scrub sensitive parameters from your log
  # filter_parameter_logging :password

  def start_stats
    @entry = CallStat.new
    @entry.user = @current_user
    if (params[:lon])
      @entry.longitude = params[:lon]
    end
    if (params[:lat])
      @entry.latitude = params[:lon]
    end
    if (params[:t])
      @entry.call_time = Time.parse(params[:t])
    end
    @entry.recv_time  = Time.now
    @entry.sessionid  = request.session_options[:id]
    @entry.controller = self.controller_name
    @entry.action     = self.action_name
  end

  def end_stats
    @entry.send_time = Time.now
    @entry.save
  end
end
