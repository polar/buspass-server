##
# Service
#   This class represents the Service Parameters for a particular Route.
#
class Service < ActiveRecord::Base
  belongs_to :direction
  belongs_to :route

  #
  # Currently, journey patterns are not shared, and neither
  # are their timing links.
  #
  has_many :journey_patterns, :dependent => :destroy
  has_many :vehicle_journeys

  #
  # The constructed name of a service is unique so it can be a persistent id
  # as well. That means we can update it from a CSV file.
  #  Route ### {Weekday|Daily|Saturday|Sunday|Weekend} {Inbound|Outbound} Service <StartDate> to <Enddate>
  # For consistency the id is the hash of the name
  #
  validates_uniqueness_of :name

  #
  # The Service.persistentid is required to be a hash of the name, so we can
  # create unique names for JourneyPatterns pointing to this service
  #
  def self.find_or_create_by_route(route_number, direction, designator, start_date, end_date)
    sd = start_date.strftime("%Y-%m-%d")
    ed = end_date.strftime("%Y-%m-%d")
    s = self.find_or_initialize_by_name( "Route #{route_number} #{designator} Service #{direction} #{sd} to #{ed}" )
    if (s.persistentid == nil)
      s.persistentid = s.name.hash.abs
    end
    s.operating_period_start_date = start_date
    s.operating_period_end_date = end_date
    s.setOperatingDays(designator)
    s.direction = Direction.find_by_name(direction)
    s.route = Route.find_by_code(route_number)
    s.save!
    return s
  end

  def locatedBy(location)
    journey_patterns.reduce(false) {|v,tl| v || tl.locatedBy(coord) }
  end

  def setOperatingDays(designator)
    self.day_class= designator

    self.monday = false
    self.tuesday = false
    self.wednesday = false
    self.thursday = false
    self.friday = false
    self.saturday = false
    self.sunday = false

    case designator
      when "Weekday"
	self.monday = true
	self.tuesday = true
	self.wednesday = true
	self.thursday = true
	self.friday = true
      when "Daily"
	self.monday = true
	self.tuesday = true
	self.wednesday = true
	self.thursday = true
	self.friday = true
	self.saturday = true
	self.sunday = true
      when "Saturday"
	self.saturday = true
      when "Sunday"
	self.sunday = true
      when "Weekend"
	self.saturday = true
	self.sunday = true
      when "Friday"
        self.friday = true
      when "Mon-Thurs"
        self.monday = true
        self.tuesday = true
        self.wednesday = true
        self.thursday = true
    end
  end

  def is_operational?(date)
    date = date.to_date
    today = DATE_FIELDS[date.wday]
    read_attribute(today) && operating_period_start_date <= date && date <= operating_period_end_date
  end

  # We create a JourneyPattern with a readable name for route, day_class, and direction.
  # The given index should make the name unique. We use the hash of the service name
  # so that we can have a persistent name in CSV files.
  def get_journey_pattern(time, index)
    # We nake the name unique with the start time
    name = "Route #{route.code} #{direction.name} #{day_class} S #{self.name}-#{index} #{time.strftime("%H:%M")}"
    jp = JourneyPattern.find_or_initialize_by_name(
	               :name => name,
	               :route => route,
	               :service => self)
    return jp
  end

  #--------------------------------------------------------------------------------------
  # Finding Services
  #--------------------------------------------------------------------------------------

  DATE_FIELDS = [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ]

  def self.find_by_route_and_date(route, date)
    self.all :conditions =>
             [ "#{DATE_FIELDS[date.wday]} AND " +
               "route_id = ? AND " +
               "? BETWEEN operating_period_start_date AND operating_period_end_date",
               route,
               date.to_date]
  end

  def self.find_by_date(date)
    date = date.to_date

    self.all :conditions =>
             [ "#{DATE_FIELDS[date.wday]} AND " +
               "? BETWEEN operating_period_start_date AND operating_period_end_date",
               date]
  end

end
