#
# Settings for Capistrano
#
set :application, "buspass-server"
set :rails_env, "production"

# Deployment From Source Code Management (SCM)
set :scm, :git
set :scm_username, "polar"
set :repository,  "git://github.com/polar/buspass-server.git"
set :git_enable_submodules, 1

# If we need a SSH Tunnel to get out or get to the remote server.
# Sadly, I think this applies to all out going connections.
#set :gateway, "polar@adiron.kicks-ass.net:922"

# Remote Server
# The app has its own user id.
set :deploy_to, "/srv/buspass-server"
set :use_sudo, false
set :user, "buspass"

# Not sure about monit yet.
#set :monit_group, "buspass"

#role :app, "buspass@suoc.syr.edu:922"
#role :web, "buspass@suoc.syr.edu:922"
#role :db,  "buspass@suoc.syr.edu:922", :primary => true
# 184.106.109.126 is adiron.com until DNS flushes
server "buspass@184.106.109.126", :web, :app, :db, :primary => true

namespace :deploy do
  task :debianize do
    # Should be calling rails-app-debianize, but it doesn't do railties.
    run("cd #{current_path}/vendor; rm -f rails railties; ln -s /usr/share/rails ; ln -s /usr/share/rails/railties")
  end
  task :install_gems do
    run("cd #{current_path}; rake gems:install")
  end
end

after("deploy:update", "deploy:debianize")
before( "deploy:restart", "deploy:install_gems")

namespace :deploy  do
  task :start do
  end
  task :restart do
  end
end
