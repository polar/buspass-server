namespace :buspass do
    desc "Seeds the Database"
    task :seed => [:environment, "db:seed"] do
       puts "Environment #{ENV['RAILS_ENV']}"
       # reads db/seeds.rb. Should be idempotent
       @routesdir = "#{Rails.root}/db/routes"
    end

    desc "Clears the Database of Persistent Route Data"
    task :clear_routes => :environment do
      require "service_table"
      ServiceTable.clear
    end

    desc "Loads Route Definitions in #{Rails.root}/db/routes/*/Route_*Uris View Path"
    task :rebuild_routes => :seed do
      require "service_table"
      routesdir = @routesdir || "#{Rails.root}/db/routes"
      ::Dir.foreach(routesdir) do |dir|
        if (dir =~ /^Network_.*/)
          path = ::File.expand_path(dir, routesdir);
          puts "Rebuilding #{dir}"
          ServiceTable.rebuildRoutes(path)
        end
      end
    end
    
    desc "Loads Route Definitions in #{Rails.root}/db/routes/*/Route_*Uris View Path"
    task :create_routes => :seed do
      require "service_table"
      routesdir = @routesdir || "#{Rails.root}/db/routes"
      ::Dir.foreach(routesdir) do |dir|
        if (dir =~ /^Network_.*/)
          path = ::File.expand_path(dir, routesdir);
          puts "Rebuilding #{dir}"
          ServiceTable.createRoutes(path)
        end
      end
    end

    desc "Loads Route Definitions in #{Rails.root}/db/routes/*/Route_*Uris View Path"
    task :fix_routes => :seed do
      require "service_table"
      routesdir = @routesdir || "#{Rails.root}/db/routes"
      ::Dir.foreach(routesdir) do |dir|
        if (dir =~ /^Network_.*/)
          path = ::File.expand_path(dir, routesdir);
          puts "Rebuilding #{dir}"
          ServiceTable.fixRoutes(path)
        end
      end
    end
    
    desc "Dumps GoogleUriViewPaths into a CSV File in #{Rails.root}/db/google_view_paths-write.csv"
    task :dump_uris => :environment do
      @uri_outfile = @uri_outfile ||  "#{Rails.root}/db/google_view_paths-write.csv"
      GoogleUriViewPath.write(@uri_outfile)
    end
    
    desc "Clears GoogleUriViewPaths"
    task :clear_uris => :environment do
      GoogleUriViewPath.delete_all
    end

    desc "Loads GoogleUriViewPaths from a CSV File in #{Rails.root}/db/google_view_paths.csv"
    task :load_uris => :environment do
      @uri_infile = @uri_infile || "#{Rails.root}/db/google_view_paths.csv"
      GoogleUriViewPath.read(@uri_infile)
    end
    
    desc "Builds the API for the local host"
    task :create_api => :environment do
      CONTROLLER_IP = UDPSocket.open {|s| s.connect("64.233.187.99", 1); s.addr.last}
      CONTROLLER_URL = "http://#{CONTROLLER_IP}:3000"
      #CONTROLLER_URL = "http://adiron.kicks-ass.net:3000"
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


  namespace :test do
    desc "Initialize Test Environment"
    task :testenv do
      Rails.env = "test"
      if (Rails.env != "test")
        abort!
      end
      @routesdir =  "#{Rails.root}/test/routes"
      @uri_infile = "#{Rails.root}/test/google_view_paths.csv"
      @uri_outfile = "#{Rails.root}/test/google_view_paths-write.csv"
      Rake::Task["environment"].invoke
    end

    desc "Seeds the Database"
    task :seed => [ :testenv, "db:seed"]
    
    desc "Clears the Database of Persistent Route Data"
    task :clear_routes => [ :testenv, "buspass:clear_routes" ]
    
    desc "Rebuilds the Test Routes"
    task :rebuild_routes => [ :testenv, :seed, "buspass:rebuild_routes" ]
    
    desc "Creates the Test Routes"
    task :create_routes => [ :testenv, :seed, "buspass:create_routes" ]
    

    desc "Loads Test Route Definitions"
    task :fix_routes => [ :testenv, :seed, "buspass:fix_routes" ]
    
    desc "Dumps Test GoogleUriViewPaths into a CSV File"
    task :dump_uris => [:testenv, "buspass:dump_uris"]

    desc "Clears GoogleUriViewPaths"
    task :clear_uris => [ :testenv, "buspass:clear_uris"] 
    
    desc "Loads Test GoogleUriViewPaths from a CSV File"
    task :load_uris => [ :testenv, "buspass:load_uris" ]

    desc "Builds the Test API for the local host"
    task :create_api => [:testenv, "buspass:create_api" ]

   desc "Build test database"
   task :db_build => [ :load_uris, :rebuild_routes]
  end
end
