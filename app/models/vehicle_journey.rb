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

  # Minutes from Midnight
  def start_time
    departure_time
  end

  def duration
    journey_pattern.duration
  end

  # Minutes from Midnight
  def end_time
    start_time + duration
  end

  # Time is minutes after/before a particular base midnight.
  def is_scheduled?(time)
    diff = (time-base_time)
    if (departure_time.minutes < diff && diff < departure_time.minutes + duration.minutes)
      return true
    else # it could be by a lot.
      #Say our base time ended up at midnight tomorrow becase it's after midnight
      # then our diff < -24 hourse
      diff = diff + 24.hours
      departure_time.minutes < diff && diff < departure_time.minutes + duration.minutes
    end
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
    begin_time = base_time + departure_time.minutes
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

  # Returns the time difference in minutes
  # Negative is early.
  def time_difference(distance, time)
    etd = base_time + departure_time.minutes
    eta = etd + journey_pattern.time_on_path(distance)
    if eta - 1.minute <= time
      if time <= eta + 1.minute
        # We are for the most part, on time
        return 0;
      else
  logger.info "LATE!!!!  #{tz(time)} ETA #{tz(eta)}  #{time-eta}  #{((time - eta)/1.minute).to_i}"
        # we are late (positive) in minutes
        return ((time - eta)/1.minute).to_i
      end
    else
  logger.info "EARLY!!!  #{tz(time)} ETA #{tz(eta)}  #{time-eta}  #{((time - eta)/1.minute).to_i}"
      # We are early (negative)
      return ((time - eta)/1.minute).to_i
    end
  end

  ##
  # Finding the JourneyLocations
  #

  DATE_FIELDS = [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ]

  def self.find_by_date(date)
    date = date.to_date

    day_field = DATE_FIELDS[date.wday]
    all = self.all :joins => [ :service ],
          :conditions =>
              ["services.#{day_field} " +
               "AND ? BETWEEN services.operating_period_start_date AND services.operating_period_end_date ",
               date],
	  :readonly => false
  end

  # Time is in minutes of midnight of the date. Be careful of TimeZone.
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
    logger.info "Being told to stop! #{name}"
    @please_stop_simulating = true
  end

  TIME_ZONE = "America/New_York"
  TZ = Time.now.in_time_zone(TIME_ZONE).zone

  def time_zone
    return TZ
  end

  def base_time
    Time.parse("0:00 #{time_zone}")
  end

  def tz(time)
    time.in_time_zone(TIME_ZONE)
  end

  class AuditLogger < Logger
    def format_message(severity, timestamp, progname, msg)
      "#{msg}\n"
    end
  end

  logger = AuditLogger.new(STDOUT)

  def simulate(time_interval, sim_time = false, logger = VehicleJourney.logger)

    if ! sim_time
      time_start = base_time + departure_time.minutes
    else
      time_start = Time.now
    end
    logger.info "Starting Simulation of #{self.name} at #{tz(Time.now)} for duration of #{duration} minutes"

    # Since we are working with time intervals, we get our current time base.
    time_base = Time.now
    time_last = time_base
    if ! sim_time
      # The base time may be midnight of the next day due to TimeZone.
      # If so the time_from_midnight will be negative. However, before we
      # add 24 hours to it, we check to see if we are scheduled within
      # a negative departure time (before midnight).
      ti_from_midnight = time_base - base_time
      if !(departure_time.minutes <= ti_from_midnight &&
          ti_from_midnight <= departure_time.minutes + duration.minutes)
        ti_from_midnight = ti_from_midnight + 24.hours
      end
      # Running time from start. If it's negative, we wait.
      ti_past = ti_from_midnight - departure_time.minutes
      # Due to a late start on the simulation, we may *already* be operating
      # with a positive time_past. Figure start time.
    else
      ti_past = 0
    end
    time_start = time_base + [ ti_past, depature_time.minutes ].max
    while ti_past < duration.minutes do
      if (ti_past >=0)
        # We are operating.
        coordinates = journey_pattern.point_on_path(ti_past)
        if journey_location == nil
          create_journey_location(:service => service, :route => service.route)
        end
        total_distance = journey_pattern.distance_on_path(ti_past) # feet
        direction      = journey_pattern.direction_on_path(ti_past) # radians from North
        reported_time  = time_start + ti_past
        timediff       = time_difference(total_distance, reported_time)

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

        logger.info "VehicleJourney '#{self.name}' recording location #{journey_location.id} of #{coordinates.inspect} at direction #{direction} distance #{total_distance} at #{tz(reported_time)} timediff #{timediff} time #{ti_past}"
      end
      if sim_time
        time_past += time_interval.seconds
      else
        sleep time_interval
        time = Time.now
        ti_since_last = time - time_last
        time_last = time
        ti_past += ti_since_last
      end

      if @please_stop_simulating
        logger.info "Stopping the Simulation of #{name}"
        break
      end
      if @please_stop_simulating
        logger.info "Break didnt' work: #{name}"
      end
    end
  rescue Exception => boom
        logger.info "Ending VehicleJourney'#{self.name}' because of #{boom}"
        logger.info boom.backtrace
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
    attr_accessor :logger

    def initialize(rs,j,t, logger = VehicleJourney.logger)
      @runners = rs
      @journey = j
      @time_interval = t
      @logger = logger
      logger.info "Initializing Journey #{journey.id} #{journey.name}"
    end

    def run
      logger.info "Starting Journey #{journey.id} #{journey.name}"
      thread = Thread.new do
	begin
	  journey.simulate(time_interval, false, logger)
          logger.info "Journey ended normally #{journey.id} #{journey.name}"
	rescue Error => boom
	  logger.info "Stopping Journey #{journey.id} #{journey.name} on #{boom}"
	ensure
	  logger.info "Removing Journey #{journey.id} #{journey.name} #{(base_time+journey.start_time.minutes).strftime("%H:%M")}-#{(base_time+journey.end_time.minutes).strftime("%H:%M")} at #{(Time.now).strftime("%H:%M")}"
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
    logger = AuditLogger.new(STDOUT)
    JourneyLocation.delete_all
    runners = {}
    while true do
      journeys = VehicleJourney.find_by_date_time(Time.now, Time.now)
      # Create Journey Runners for new Journeys.
      for j in journeys do
	if !runners.keys.include?(j.id)
	  runners[j.id] = JourneyRunner.new(runners,j,time_interval,logger).run
	end
      end
      sleep 60
    end
  rescue Exception => boom
    logger.info "Simulation Ending because #{boom}"
    logger.info boom.backtrace.join("\n")
  ensure
    puts "Stopping Simulation #{runners.keys.size} Runners"
    keys = runners.keys.clone
    for k in keys do
      runner = runners[k]
      if runner != nil
	logger.info "Killing #{runner.journey.id} #{runner.journey.id} thread = #{runner.journey.id}"
	if runner.journey != nil
	  runner.journey.stop_simulating
	end
      end
    end
    logger.info "Waiting"
    while !runners.empty? do
      logger.info "#{runners.keys.size} Runners"
      sleep time_interval
    end
    logger.info "All stopped"
  end

end
