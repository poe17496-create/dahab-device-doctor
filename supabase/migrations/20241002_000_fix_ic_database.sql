-- Migration: Fix IC Database Table Structure
-- This migration drops the existing ic_database table and recreates it with the correct structure

-- Drop the existing table
DROP TABLE IF EXISTS ic_database CASCADE;

-- Recreate the table with correct structure
CREATE TABLE ic_database (
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

-- Create indexes
CREATE INDEX idx_ic_database_part ON ic_database(part_number);
CREATE INDEX idx_ic_database_category ON ic_database(category);
CREATE INDEX idx_ic_database_family ON ic_database(device_family);
CREATE INDEX idx_ic_database_compatibles ON ic_database USING GIN(compatibles);

-- Add comment
COMMENT ON TABLE ic_database IS 'IC database with part numbers, functions, and donor board information';

-- Enable RLS
ALTER TABLE ic_database ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Public read access for ic_database" ON ic_database;
CREATE POLICY "Public read access for ic_database" ON ic_database FOR SELECT USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_ic_database ON ic_database;
CREATE TRIGGER set_updated_at_ic_database BEFORE UPDATE ON ic_database
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
