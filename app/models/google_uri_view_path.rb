class GoogleUriViewPath < ActiveRecord::Base
  require "open-uri"
  require "hpricot"
  require "faster_csv"

  serialize :view_path_coordinates

  def self.find_or_create(uri)
    begin
      self.find(uri.hash.abs)
    rescue
      x =  self.new(:id => uri.hash.abs, :uri => uri)
      x.id = uri.hash.abs
      puts x.uri
      puts x.inspect
      return x
    end
  end

  def self.getViewPathCoordinates(uri)
    if uri.start_with?("http:")
      cache = self.find_or_create(uri)
      if cache.view_path_coordinates == nil
	doc = open("#{uri}&output=kml") {|f| Hpricot(f) }
	x = doc.at("geometrycollection/linestring/coordinates").inner_html.split(",0.000000 ").map {|x| eval "[#{x}]" }
	ans = { "LonLat" => x }
	cache.view_path_coordinates = ans
	cache.save!
      else
	ans = cache.view_path_coordinates
      end
  #     puts "URI = #{ans.inspect}"
      return ans
    else
      # KML
      doc = Hpricot(uri)
      x = doc.at("placemark/linestring/coordinates").inner_html.strip.split(",0 ").map {|x| eval "[#{x}].take(2)" }
      ans = { "LonLat" => x }
    end
  end

  def self.read(file)
    ts = []
    FasterCSV.read(file, :headers => true).each do |opts|
      begin
        t = self.find(opts["uri"].hash.abs)
        puts "Found #{self.class_name} at #{t.id} #{t.uri}"
      rescue
        t = self.new
        t.id = opts["uri"].hash.abs
      end
      t.uri = opts["uri"]
      s =  YAML::load(opts["coordinates"])
      if (s.is_a? Hash)
        t.view_path_coordinates = s
      elsif (s.is_a? String)
        t.view_path_coordinates = YAML::load(s)
      else
        raise "Invalid Format for Coordinates"
      end

      ts << t
      t.save!
    end
    ts
  end

  HEADER = ["uri", "coordinates"]
  def self.to_csv(ts = nil)
    if (ts == nil)
      ts = self.all
    end
    if (ts.empty?)
      FasterCSV::Table.new(
                     [FasterCSV::Row.new(HEADER,
                     ["",""])])
    else
      FasterCSV::Table.new(ts.collect { |x| x.to_csv})
    end
  end

  def self.write(name)
    csv = FasterCSV.open(name, "w+")
    csv << FasterCSV::Row.new(HEADER,HEADER)
    self.all.each {|x| csv << x.to_csv }
    csv.close
  end

  def to_csv
    FasterCSV::Row.new(HEADER,
                       [uri, view_path_coordinates.to_yaml.to_s.inspect]);
  end
end
