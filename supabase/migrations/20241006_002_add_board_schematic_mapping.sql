-- Migration: Add Board-Schematic Mapping Table
-- This migration adds a mapping table to associate boards with their schematics

CREATE TABLE IF NOT EXISTS board_schematic_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  schematic_id UUID REFERENCES schematics(id) ON DELETE CASCADE,
  alignment_data JSONB DEFAULT '{}'::jsonb,
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, schematic_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_board_schematic_board_id ON board_schematic_mappings(board_id);
CREATE INDEX IF NOT EXISTS idx_board_schematic_schematic_id ON board_schematic_mappings(schematic_id);
CREATE INDEX IF NOT EXISTS idx_board_schematic_is_primary ON board_schematic_mappings(is_primary);

-- Add comment
COMMENT ON TABLE board_schematic_mappings IS 'Mapping table to associate boards with their corresponding schematics and alignment data';

-- Enable Row Level Security (RLS)
ALTER TABLE board_schematic_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Public read access
DROP POLICY IF EXISTS "Public read access for board_schematic_mappings" ON board_schematic_mappings;
CREATE POLICY "Public read access for board_schematic_mappings" ON board_schematic_mappings FOR SELECT USING (true);

-- RLS Policy - Allow insert from server side (with service role)
DROP POLICY IF EXISTS "Server insert access for board_schematic_mappings" ON board_schematic_mappings;
CREATE POLICY "Server insert access for board_schematic_mappings" ON board_schematic_mappings FOR INSERT WITH CHECK (true);

-- RLS Policy - Allow update from server side
DROP POLICY IF EXISTS "Server update access for board_schematic_mappings" ON board_schematic_mappings;
CREATE POLICY "Server update access for board_schematic_mappings" ON board_schematic_mappings FOR UPDATE USING (true);

-- Apply trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_board_schematic_mappings ON board_schematic_mappings;
CREATE TRIGGER set_updated_at_board_schematic_mappings BEFORE UPDATE ON board_schematic_mappings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
