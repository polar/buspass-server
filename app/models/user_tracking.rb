##
# Tracking things about users
# Currently only amount of logins by virtue of
# the counting of these records and
# we record login location.
#
class UserTracking < ActiveRecord::Base
  belongs_to :user
end
