Rake.application.remove_task 'db:test:prepare'

namespace :db do
  namespace :test do
    task :prepare do
      # Stub out 
      puts "EATME!"
    end
  end
end
