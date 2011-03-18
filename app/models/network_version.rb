##
# The NetworkVersion
#  Currently not used, or at least not much attention to which is paid.
#
class NetworkVersion < ActiveRecord::Base

  validates_uniqueness_of :name
end
