-- Migration: Add Schematics Table for Schematic Diagrams
-- This migration adds schematics table to store electronic schematic diagrams

CREATE TABLE IF NOT EXISTS schematics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schematic_name TEXT NOT NULL,
  schematic_url TEXT NOT NULL,
  device_model TEXT,
  board_type TEXT,
  description TEXT,
  components JSONB DEFAULT '[]'::jsonb,
  nets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schematics_name ON schematics(schematic_name);
CREATE INDEX IF NOT EXISTS idx_schematics_device_model ON schematics(device_model);
CREATE INDEX IF NOT EXISTS idx_schematics_board_type ON schematics(board_type);

-- Add comment
COMMENT ON TABLE schematics IS 'Table for storing electronic schematic diagrams with component and net information';

-- Enable Row Level Security (RLS)
ALTER TABLE schematics ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Public read access
DROP POLICY IF EXISTS "Public read access for schematics" ON schematics;
CREATE POLICY "Public read access for schematics" ON schematics FOR SELECT USING (true);

-- RLS Policy - Allow insert from server side (with service role)
DROP POLICY IF EXISTS "Server insert access for schematics" ON schematics;
CREATE POLICY "Server insert access for schematics" ON schematics FOR INSERT WITH CHECK (true);

-- RLS Policy - Allow update from server side
DROP POLICY IF EXISTS "Server update access for schematics" ON schematics;
CREATE POLICY "Server update access for schematics" ON schematics FOR UPDATE USING (true);

-- Apply trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_schematics ON schematics;
CREATE TRIGGER set_updated_at_schematics BEFORE UPDATE ON schematics
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
