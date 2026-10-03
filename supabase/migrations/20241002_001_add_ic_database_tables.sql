-- Migration: Add IC Database and Hardware Schematics Matrix Tables
-- This migration adds tables for IC database and hardware schematics matrix
-- to replace local JSON files with Supabase database for better performance.

-- 1. IC Database Table
CREATE TABLE IF NOT EXISTS ic_database (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_number TEXT NOT NULL,
  category TEXT NOT NULL,
  device_family TEXT NOT NULL,
  function TEXT NOT NULL,
  compatibles TEXT[] DEFAULT '{}',
  common_symptoms TEXT,
  diode_readings TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hardware Schematics Matrix Table (859+ boards)
CREATE TABLE IF NOT EXISTS hardware_schematics_matrix (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  board_code TEXT NOT NULL,
  category TEXT NOT NULL,
  year INTEGER,
  main_chips JSONB DEFAULT '{}'::jsonb,
  power_rails JSONB DEFAULT '{}'::jsonb,
  key_components JSONB DEFAULT '{}'::jsonb,
  cpu TEXT,
  gpu TEXT,
  pmic TEXT,
  audio_codec TEXT,
  wifi_module TEXT,
  bluetooth_module TEXT,
  display_driver TEXT,
  touch_controller TEXT,
  storage_controller TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Donor Boards Table (extracted from matrix for faster queries)
CREATE TABLE IF NOT EXISTS donor_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES hardware_schematics_matrix(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  board_code TEXT NOT NULL,
  category TEXT NOT NULL,
  role_on_board TEXT NOT NULL,
  chip_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ic_database_part ON ic_database(part_number);
CREATE INDEX IF NOT EXISTS idx_ic_database_category ON ic_database(category);
CREATE INDEX IF NOT EXISTS idx_ic_database_family ON ic_database(device_family);
CREATE INDEX IF NOT EXISTS idx_ic_database_compatibles ON ic_database USING GIN(compatibles);

CREATE INDEX IF NOT EXISTS idx_schematics_matrix_brand ON hardware_schematics_matrix(brand);
CREATE INDEX IF NOT EXISTS idx_schematics_matrix_model ON hardware_schematics_matrix(model);
CREATE INDEX IF NOT EXISTS idx_schematics_matrix_code ON hardware_schematics_matrix(board_code);
CREATE INDEX IF NOT EXISTS idx_schematics_matrix_category ON hardware_schematics_matrix(category);
CREATE INDEX IF NOT EXISTS idx_schematics_matrix_chips ON hardware_schematics_matrix USING GIN(main_chips);

CREATE INDEX IF NOT EXISTS idx_donor_boards_chip ON donor_boards(chip_name);
CREATE INDEX IF NOT EXISTS idx_donor_boards_brand ON donor_boards(brand);
CREATE INDEX IF NOT EXISTS idx_donor_boards_model ON donor_boards(model);
CREATE INDEX IF NOT EXISTS idx_donor_boards_board ON donor_boards(board_id);

-- Add comments for documentation
COMMENT ON TABLE ic_database IS 'IC database with part numbers, functions, and donor board information';
COMMENT ON TABLE hardware_schematics_matrix IS 'Hardware schematics matrix for 859+ boards with chip information';
COMMENT ON TABLE donor_boards IS 'Donor boards extracted from schematics matrix for faster IC matching';

-- Enable Row Level Security (RLS)
ALTER TABLE ic_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_schematics_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public read access for ic_database" ON ic_database;
DROP POLICY IF EXISTS "Public read access for hardware_schematics_matrix" ON hardware_schematics_matrix;
DROP POLICY IF EXISTS "Public read access for donor_boards" ON donor_boards;

CREATE POLICY "Public read access for ic_database" ON ic_database FOR SELECT USING (true);
CREATE POLICY "Public read access for hardware_schematics_matrix" ON hardware_schematics_matrix FOR SELECT USING (true);
CREATE POLICY "Public read access for donor_boards" ON donor_boards FOR SELECT USING (true);

-- Create trigger function for automatic timestamp management
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_updated_at_ic_database ON ic_database;
DROP TRIGGER IF EXISTS set_updated_at_schematics_matrix ON hardware_schematics_matrix;

CREATE TRIGGER set_updated_at_ic_database BEFORE UPDATE ON ic_database
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_schematics_matrix BEFORE UPDATE ON hardware_schematics_matrix
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
