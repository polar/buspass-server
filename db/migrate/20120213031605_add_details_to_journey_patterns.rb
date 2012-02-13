class AddDetailsToJourneyPatterns < ActiveRecord::Migration
  def change
    add_column :journey_patterns, :version_cache, :integer
    add_column :journey_patterns, :coordinates_cache, :text
  end
end
