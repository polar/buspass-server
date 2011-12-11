class Users < ActiveRecord::Migration
  def self.up
    change_table :users do |t|
      t.datetime :remember_created_at
      t.datetime :remember_updated_at
    end
  end

  def self.down
  end
end
