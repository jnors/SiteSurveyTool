-- Migration: Add drive_root_folder_id to profiles table
-- This column stores the Google Drive root folder ID for the FieldPins folder
-- to enable compatibility with the drive.file OAuth scope

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS drive_root_folder_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.drive_root_folder_id IS 'Google Drive folder ID for the root FieldPins folder';
