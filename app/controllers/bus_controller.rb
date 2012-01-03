class BusController < ApplicationController
    include AuthenticatedSystem

    before_filter :login_required

    def report_location
        id = params[:user]
        @lat = params[:lat]
        @lon = params[:lon]
        @dir = params[:dir]
        @time = params[:time]
        @user = User.find(id)

        user_loc = UserLocation.find_by_user_id(id)
        if (user_loc != nil)
            if (user_loc.reported_time < @time)
                user_loc.last_coordinates = user_loc.coordinates
                user_loc.last_reported_time = user_loc.reported_time
                user_loc.last_direction = user_loc.direction
            end
        else
            user_loc = UserLocation.new()
        end
        user_loc.coordinates = [@lon, @lat]
        user_loc.reported_time = @time
        user_loc.direction = @dir
        user_loc.user_id = id
        user_loc.save!

        # We look at all JourneyLocations, which are currently operating
        # VehicleJourneys.
        js = JourneyLocation.all
        njs = []
        for j in js do
            if j.vehicle_journey.journey_pattern.isOnRoute?(user_loc.coordinates,60)
                njs += j
            end
        end
        # Next is to decide whether the user is on a journey.
        # We record positions on any journey.
        for j in njs do
          feas =  j.is_feasible?([@lon,@lat], user_loc.reported_time, -10, 20)
          if (feas != nil )
            x = ReportedJourneyLocation.new();
            x.user = @user
            x.vehicle_journey = j
            x.location = user_loc.coordinates
            x.direction = user_loc.direction
            x.reported_time = user_loc.reported_time
            x.recorded_time = Time.now
            x.speed = null;
            x.save
          end
        end
    end
end
