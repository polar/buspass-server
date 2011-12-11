require 'capistrano/ext/multistage'

set :default_stage, "production"

#
# We know the production path for getting the
# assets from production to staging.
#
set :_PRODUCTION_PATH, "/srv/buspass-server/current"

#set :gateway, "polar@adiron.kicks-ass.net:922"

#
# Git Configuration
#
set :scm,          "git"
set :scm_username, "polar"
set :repository,   "git://github.com/polar/buspass-server.git"

#
# Do not use sudo and use user "deploy"
#
set :use_sudo, false
set :user, "buspass"


#
# Multistage Defaults
#
#set :stage_dir, "config/deploy"
#   The following gets evaluation delayed.

# Custom Tasks
namespace :deploy do

  desc "Copying the right config files and sym links for the current stage environment."
  task :after_default do

    # Move environment-specific configs into config directory.
    %w{suoc.monitrc}.each do |file|
      run "cp -p #{release_path}/config/deploy/#{rails_env}/#{file} #{release_path}/config/#{file}"
    end

    # Move forward uploads and index directories along with new release.
    # These are photos page_photos and homepage_features attachments.
    %w{photos page_photos homepage_features}.each do |share|
      run "rm -rf #{release_path}/public/#{share}"
      run "rm -rf #{release_path}/#{share}"
      run "mkdir -p #{shared_path}/system/#{share}"
      run "ln -s #{shared_path}/system/#{share} #{release_path}/public/#{share}"
    end

    cleanup
  end

  desc "Transfer db and assests from production to staging."
  task :after_finalize_update do
    if rails_env == "staging"
      run "cd #{release_path}; rake RAILS_ENV=staging db:stage PRODUCTION_PATH=#{_PRODUCTION_PATH}"
    end
  end

  desc "Place the maintenance page out into the public path."
  task :disable_web, :roles => :web, :except => { :no_release => true } do
    require 'erb'
    on_rollback { run "rm #{shared_path}/system/maintenance.html" }

    reason = ENV['REASON']
    deadline = ENV['UNTIL']

    template = File.read(File.join(File.dirname(__FILE__), "templates", "maintenance.html.erb"))
    result = ERB.new(template).result(binding)

    put result, "#{shared_path}/system/maintenance.html", :mode => 0644
  end

  desc "Analyze Rails Log instantaneously"
  task :pl_analyze, :roles => :app do
    run "pl_analyze #{shared_path}/log/#{rails_env}.log" do |ch, st, data|
      print data
    end
  end

  desc "Run rails_stat"
  task :rails_stat, :roles => :app do
    stream "rails_stat #{shared_path}/log/#{rails_env}.log"
  end
end


