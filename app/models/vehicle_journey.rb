class VehicleJourney < ActiveRecord::Base
  include LocationBoxing

  belongs_to :journey_pattern
  belongs_to :service
  has_one :journey_location, :dependent => :delete

  # We only make the name unique so that we may update them by
  # human sight and reading in a CSV file.
  validates_uniqueness_of :name

  validates_presence_of :journey_pattern
  validates_presence_of :service

  before_save :make_id_name

  def make_id_name
    persistentid = name.hash.abs
  end

  def check_name
    puts "AfterSAVE  id #{persistentid} hash #{name.hash.abs} name #{name}"
  end

  def yamlid
    "#{name}"
  end

  def start_time
    departure_time
  end

  def duration
    time = 0
    for timing_link in journey_pattern.journey_pattern_timing_links do
      time += timing_link.time
    end
    return time
  end

  def end_time
    time = departure_time
    for timing_link in journey_pattern.journey_pattern_timing_links do
      time += timing_link.time
    end
    return time
  end

  def is_scheduled?(time)
    time_start = Time.parse("0:00")+departure_time.minutes
    time_end = time_start + duration.minutes
    return time_start <= time && time <= time_end
  end

  def locatedBy(coord)
    journey_pattern.locatedBy(coord)
  end

  ##
  # Returns the direction in radians from north that a bus on a particular
  # link will be going at a particular location near that link
  #
  def direction(coord, buffer, time)
    tls = journey_pattern.journey_pattern_timing_links
    begin_time = DateTime.parse("0:00 #{Time.now.zone}") + departure_time.minutes
    for tl in tls do
      end_time = begin_time + tl.time.minutes
      if (begin_time - 10.minutes <= time && time <= end_time + 10.minutes)
        if tl.isBoundedBy(coord)
          begin
            return tl.direction(coord, buffer)
          rescue
            # Not on Link, but it could be on another link that is bounded in.
          end
        end
      end
      begin_time = end_time
    end
    raise Not on Pattern
  end

  # Returns the time difference in seconds
  # Negative is early.
  def time_difference(distance, time)
    etd = Time.parse("0:00") + departure_time.minutes
    eta = etd + journey_pattern.time_on_path(distance)
    if eta - 1.minute <= time
      if time <= eta + 1.minute
        # We are for the most part, on time
        return 0;
      else
  puts "LATE!!!!  #{time} ETA #{eta}  #{time-eta}  #{((time - eta)/1.minute).to_i}"
        # we are late (positive) in seconds
        return ((time - eta)/1.minute).to_i
      end
    else
  puts "EARLY!!!  #{time} ETA #{eta}  #{time-eta}  #{((time - eta)/1.minute).to_i}"
      # We are early (negative)
      return ((time - eta)/1.minute).to_i
    end
  end

  # Returns the time_difference in minutes.
  def time_difference_DONTUSE(coord,time)
    # TODO: This algorithm has problems with circular routes
    # or close to them.
    # if the departure time is negative and we are still before midnight
    # then we have to go from yesterday. What's the threshold?
    etd = DateTime.parse("0:00 #{Time.now.zone}") + departure_time.minutes
    tls = journey_pattern.journey_pattern_timing_links
    for tl in tls do
       eta = etd + tl.time.minutes
       puts "ETD #{etd}  #{time} ETA #{eta}"
       if tl.isBoundedBy(coord)
        if tl.isOnRoute(coord, 60)  # TODO: Buffer is in feet, need to change to meters
          if etd <= time
            if time <= eta
              # We are for the most part, on time
              return 0;
            else
       puts "LATE!!!!  ETD #{etd}  #{time} etd<=time: #{etd<=time} ETA #{eta}  eta<=time: #{eta<=time} #{time-eta} #{(time-eta)/60} #{((time.to_time - etd.to_time)/60).to_i}"
              # we are late (positive) in minutes
              return ((time.to_time - etd.to_time)/60).to_i
            end
          else
       puts "EARLY!!!  ETD #{etd}  #{time} etd<=time: #{etd<=time} ETA #{eta}  #{time-eta} #{(time-eta)/60} #{((time.to_time - eta.to_time)/60).to_i}"
            # We are early (negative)
            return ((time.to_time - eta.to_time)/60).to_i
          end
        end
       end
       tls = tls.drop(1)
       tl = tls.first
       etd = eta
    end
    return 0
  end

  ##
  # Finding the JourneyLocations
  #

  DATE_FIELDS = [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ]

  def self.find_by_date(date)
    date = date.to_date

    day_field = DATE_FIELDS[date.wday]
    pday_field = DATE_FIELDS[(date-1.day).wday]
    # We must find the previous day as date as well, as some journeys may
    # start before midnight. (negavtive start_time).
    all = self.all :joins => [ :service ],
          :conditions =>
              ["(services.#{day_field} OR services.#{pday_field})" +
               "AND ? BETWEEN services.operating_period_start_date AND services.operating_period_end_date ",
               date],
	  :readonly => false
  end

  def self.find_by_date_time(date, time)
    all = self.find_by_date(date)
    all.select { |vj| vj.is_scheduled?(time) }
  end

  ############################################################################
  # Simulations
  ############################################################################

  # This function sets a indication so that the simulation for the
  # this journey stops on the next wake up call.
  def stop_simulating
    @please_stop_simulating = true
  end

  def simulate(time_interval, sim_time = false)
    # Duration is stored in minutes, need to covert
    dur = duration.minutes

    if ! sim_time
      time_start = Time.parse("0:00") + departure_time.minutes
    else
      time_start = Time.now
    end
    puts "Starting Simulation of #{self.name} at #{Time.now} for duration of #{duration} minutes"

    time_past = Time.now - time_start
    while time_past < dur do
      coordinates = journey_pattern.point_on_path(time_past)
      if journey_location == nil
        create_journey_location(:service => service, :route => service.route)
        direction = journey_pattern.starting_direction
        total_distance = 0
      else
        time_previous  = journey_location.reported_time
        coord_previous = journey_location.coordinates
        total_distance = journey_pattern.distance_on_path(time_past) # feet
        direction      = journey_pattern.direction_on_path(time_past) # radians from North
      end
      reported_time  = time_start + time_past
      timediff = time_difference(total_distance, reported_time)

      journey_location.last_coordinates   = journey_location.coordinates
      journey_location.last_reported_time = journey_location.reported_time
      journey_location.last_distance      = journey_location.distance
      journey_location.last_direction     = journey_location.direction
      journey_location.last_timediff      = journey_location.timediff

      journey_location.coordinates   = coordinates
      journey_location.direction     = direction
      journey_location.distance      = total_distance
      journey_location.timediff      = timediff
      journey_location.reported_time = reported_time
      journey_location.recorded_time = Time.now

      journey_location.save!

      puts "VehicleJourney '#{self.name}' recording location #{journey_location.id} of #{coordinates.inspect} at direction #{direction} distance #{total_distance} timediff #{timediff} time #{time_past}"

      if sim_time
        time_past += time_interval.seconds
      else
        sleep time_interval
        time_past = Time.now - time_start
      end

      if @please_stop_simulating
        break;
      end
    end
  rescue Exception => boom
        puts "Ending VehicleJourney'#{self.name}' because of #{boom}"
        puts boom.backtrace
  ensure
    if journey_location != nil
      journey_location.destroy
      # The following reloads so that the relationship between this object and
      # journey token is unfrozen, otherwise error "cant modify frozen hash" TypeError happens.
      self.reload
    end
  end

  #---------------------------------------------------
  # Simulator for all VehicleJourneys
  # Run from a Console or Background Process
  #---------------------------------------------------
  # TODO: Make puts calls to log

  class JourneyRunner
    attr_accessor :journey
    attr_accessor :runners
    attr_accessor :thread
    attr_accessor :time_interval

    def initialize(rs,j,t)
      @runners = rs
      @journey = j
      @time_interval = t
      puts "Initializing Journey #{journey.id} #{journey.name}"
    end

    def run
      puts "Starting Journey #{journey.id} #{journey.name}"
      thread = Thread.new do
	begin
	  journey.simulate(time_interval)
	rescue Error => boom
	  puts "Stopping Journey #{journey.id} #{journey.name} on #{boom}"
	ensure
	  puts "Removing Journey #{journey.id} #{journey.name} #{(Time.parse("0:00")+journey.start_time.minutes).strftime("%H:%M")}-#{(Time.parse("0:00")+journey.end_time.minutes).strftime("%H:%M")} at #{(Time.now).strftime("%H:%M")}"
	  runners.delete(journey.id)
	end
      end
      self
    end
  end

  # Simulates all the appropriate vehicle journeys updating locations
  # on the time_interval. The active journey list checked every 60
  # seconds. An exception delivered to this function will end the
  # simulation of all running journeys.
  def self.simulate_all(time_interval)
    JourneyLocation.delete_all
    runners = {}
    while true do
      journeys = VehicleJourney.find_by_date_time(Time.now, Time.now)
      # Create Journey Runners for new Journeys.
      for j in journeys do
	if !runners.keys.include?(j.id)
	  runners[j.id] = JourneyRunner.new(runners,j,time_interval).run
	end
      end
      sleep 60
    end
  rescue Exception => boom
    puts "Simulation Ending because #{boom}"
	print boom.backtrace.join("\n")
  ensure
    puts "Stopping Simulation #{runners.keys.size} Runners"
    keys = runners.keys.clone
    for k in keys do
      runner = runners[k]
      if runner != nil
	puts "Killing #{runner.journey.id} #{runner.journey.id} thread = #{runner.journey.id}"
	if runner.journey != nil
	  runner.journey.stop_simulating
	end
      end
    end
    puts "Waiting"
    while !runners.empty? do
      puts "#{runners.keys.size} Runners"
      sleep time_interval
    end
    puts "All stopped"
  end

end
