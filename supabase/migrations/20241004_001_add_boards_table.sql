-- Migration: Add Boards Table for Image Caching
-- This migration adds a boards table to cache motherboard images

CREATE TABLE IF NOT EXISTS boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_name TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  search_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_boards_name ON boards(board_name);

-- Add comment
COMMENT ON TABLE boards IS 'Cache table for motherboard images with automatic image fetching';

-- Enable Row Level Security (RLS)
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Public read access
DROP POLICY IF EXISTS "Public read access for boards" ON boards;
CREATE POLICY "Public read access for boards" ON boards FOR SELECT USING (true);

-- RLS Policy - Allow insert from server side (with service role)
DROP POLICY IF EXISTS "Server insert access for boards" ON boards;
CREATE POLICY "Server insert access for boards" ON boards FOR INSERT WITH CHECK (true);

-- RLS Policy - Allow update from server side
DROP POLICY IF EXISTS "Server update access for boards" ON boards;
CREATE POLICY "Server update access for boards" ON boards FOR UPDATE USING (true);

-- Create function for updated_at trigger (if not exists)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_boards ON boards;
CREATE TRIGGER set_updated_at_boards BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
