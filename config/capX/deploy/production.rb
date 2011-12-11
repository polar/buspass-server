#
# Capfile
#
set :application, "buspass-server"
set :repository,  "git://github.com/polar/buspass-server.git"
set :git_enable_submodules, 1

set :deploy_to, "/srv/buspass-server"

set :scm, :git

set :use_sudo, false

set :scm_username, "polar"

#set :gateway, "polar@adiron.kicks-ass.net:922"

# User on remote system for deployement
set :user, "buspass"

set :rails_env, "production"

# Not sure about monit yet.
set :monit_group, "buspass"

role :app, "buspass@suoc.syr.edu:922"
role :web, "buspass@suoc.syr.edu:922"
role :db,  "buspass@suoc.syr.edu:922", :primary => true
