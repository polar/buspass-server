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
server "buspass@adiron.com", :web, :app, :db, :primary => true
#server "buspass@192.168.99.3", :web, :app, :db, :primary => true

namespace :deploy do
  task :install_gems do
    run("cd #{current_path}; rake gems:install")
  end
end


namespace :deploy  do
  task :start do
    run "/etc/init.d/buspass-server-unicorn start"
    run "/etc/init.d/buspass-server-nginx start"
  end
  task :stop do
    run "/etc/init.d/buspass-server-unicorn stop"
    run "/etc/init.d/buspass-server-nginx stop"
  end
  task :restart do
    run "/etc/init.d/buspass-server-unicorn restart"
    run "/etc/init.d/buspass-server-nginx restart"
  end
end
