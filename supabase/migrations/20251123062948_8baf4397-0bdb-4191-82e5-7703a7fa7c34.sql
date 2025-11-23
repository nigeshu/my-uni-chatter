-- Add maintenance mode column to semester_settings table
ALTER TABLE semester_settings
ADD COLUMN maintenance_mode_enabled boolean NOT NULL DEFAULT false;