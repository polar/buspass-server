class AddVersionCacheToRoute < ActiveRecord::Migration
  def change
    add_column :routes, :version_cache, :integer
  end
end
