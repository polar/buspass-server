# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_buspass.server_session',
  :secret      => 'eec9620e61b3e47667ec5c76ab4197ed52fad29ff47610c2256171efc5e6fe5ffd0b8ebfd4a4e236c10d86c5566e5bc27d9e256d23c13d99a3be88b6cab2d8db'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
