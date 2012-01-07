class BusController < ApplicationController

    before_filter :authenticate_user!

    def initialize()
      @clock ||= Time
    end

    def report_location
        @lat = params[:lat].to_f
        @lon = params[:lon].to_f
        @dir = params[:dir].to_f
        @speed = params[:speed].to_f
        @time = Time.parse(params[:time])
        @user = current_user

        @user_loc = UserLocation.find_by_user_id(@user)
        if (@user_loc != nil)
            if (@user_loc.reported_time < @time)
                @user_loc.last_coordinates = user_loc.coordinates
                @user_loc.last_reported_time = user_loc.reported_time
                @user_loc.last_direction = user_loc.direction
            end
        else
            @user_loc = UserLocation.new()
        end
        @user_loc.coordinates = [@lon, @lat]
        @user_loc.reported_time = @time
        @user_loc.recorded_time = @clock.now
        @user_loc.direction = @dir
        @user_loc.user = @user
        @user_loc.save!

        # We look at all JourneyLocations, which are currently operating
        # VehicleJourneys.
        # TODO: Enhance for Muncipalities
        # TODO: JourneyLocation should exist 5 to 10 minutes before
        # the journey start time, so that we can pick it up here. As
        # the bus may be sitting there and people get on it before
        # it leaves.
        js = JourneyLocation.all
        njs = []
        for j in js do
            if j.vehicle_journey.journey_pattern.isOnRoute(@user_loc.coordinates,60)
                njs += [j]
            end
        end
        # TODO: This has got to be better. Maybe get confirmation from the user.
        # Next is to decide whether the user is on a journey.
        # We record positions on any journey.
        for j in njs do
          feas =  j.vehicle_journey.is_feasible?([@lon,@lat], @time, -10, 20)
          if (feas != nil )
            x = ReportedJourneyLocation.new()
            x.user = @user
            x.vehicle_journey = j.vehicle_journey
            x.location = @user_loc.coordinates
            x.direction = @dir
            x.reported_time = @time
            x.recorded_time = @clock.now
            x.speed = @speed;
            x.save!
          end
        end

        render :text => ""
    end
end
