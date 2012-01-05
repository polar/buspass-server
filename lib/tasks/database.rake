namespace :buspass do
  namespace :test do
    desc "Initialize Test Environment"
    task :testenv do
      Rails.env = "test"
      if (Rails.env != "test")
        abort!
      end
      Rake::Task["environment"].invoke
    end

    desc "Seeds the Database"
    task :seed => "db:seed" do
       puts "Environment #{ENV['RAILS_ENV']}"
       # reads db/seeds.rb. Should be idempotent
    end

    desc "Clears the Database of Persistent Route Data"
    task :clear_routes => :testenv do
      require "service_table"
      ServiceTable.clear
    end

    desc "Loads Route Definitions in #{Rails.root}/test/routes/*/Route_*Uris View Path"
    task :rebuild_routes => [ :testenv, :seed ] do
      require "service_table"
      routesdir = "#{Rails.root}/test/routes"
      ::Dir.foreach(routesdir) do |dir|
        if (dir =~ /^Network_.*/)
          path = ::File.expand_path(dir, routesdir);
          puts "Rebuilding #{dir}"
          ServiceTable.rebuildRoutes(path)
        end
      end
    end

    desc "Loads Route Definitions in #{Rails.root}/test/routes/*/Route_*Uris View Path"
    task :create_routes => [ :testenv, :seed ] do
      require "service_table"
      routesdir = "#{Rails.root}/test/routes"
      ::Dir.foreach(routesdir) do |dir|
        if (dir =~ /^Network_.*/)
          path = ::File.expand_path(dir, routesdir);
          puts "Rebuilding #{dir}"
          ServiceTable.createRoutes(path)
        end
      end
    end

    desc "Loads Route Definitions in #{Rails.root}/test/routes/*/Route_*Uris View Path"
    task :fix_routes => [ :testenv, :seed ] do
      require "service_table"
      routesdir = "#{Rails.root}/test/routes"
      ::Dir.foreach(routesdir) do |dir|
        if (dir =~ /^Network_.*/)
          path = ::File.expand_path(dir, routesdir);
          puts "Rebuilding #{dir}"
          ServiceTable.fixRoutes(path)
        end
      end
    end

    desc "Dumps GoogleUriViewPaths into a CSV File in #{Rails.root}/test/google_view_paths-write.csv"
    task :dump_uris => :testenv do
      GoogleUriViewPath.write("#{Rails.root}/test/google_view_paths-write.csv")
    end

    desc "Clears GoogleUriViewPaths"
    task :clear_uris => :testenv do
      GoogleUriViewPath.delete_all
    end

    desc "Loads GoogleUriViewPaths from a CSV File in #{Rails.root}/test/google_view_paths.csv"
    task :load_uris => :testenv do
      GoogleUriViewPath.read("#{Rails.root}/test/google_view_paths.csv")
    end

    desc "Builds the API for the local host"
    task :create_api => :testenv do
      CONTROLLER_IP = UDPSocket.open {|s| s.connect("64.233.187.99", 1); s.addr.last}
      CONTROLLER_URL = "http://#{CONTROLLER_IP}:3000"
      CONTROLLER_URL = "http://adiron.kicks-ass.net:3000"
      api = Api.new
      api.major_version = 1
      api.minor_version = 1

      text = "<API\n"
      text += "majorVersion= '#{api.major_version}'\n"
      text += "minorVersion= '#{api.minor_version}'\n"
      text += "getRouteJourneyIds = '#{CONTROLLER_URL}/pass/route_journeys.text'\n"
      text += "getRouteDefinition = '#{CONTROLLER_URL}/pass/route_journey/'\n"
      text += "getJourneyLocation = '#{CONTROLLER_URL}/pass/curloc/'\n"
      text += "/>"
      api.definition = text
      Api.transaction do
        Api.delete_all
        api.save!
      end
   end

   desc "Build test database"
   task :db_build => [:testenv, :load_uris, :rebuild_routes]

  end
end
