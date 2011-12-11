require 'digest/sha1'

##
# This class is from Restful Authentication.
# We've eliminated a lot of things, because we don't
# actually log the user in.
#
# User only logs in by cookie.
#
class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable and :omniauthable
  devise :token_authenticatable, 
         :trackable,
         :rememberable
         #:database_authenticatable, 
         #:registerable,
         #:recoverable, :validatable
         
  attr_accessible :login, :email, :name, :password, :password_confirmation


end
