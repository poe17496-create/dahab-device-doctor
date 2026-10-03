-- قم بتشغيل هذا الأمر في محرر SQL في Supabase
-- سيقوم هذا بحذف الجدول القديم وإعادة إنشائه بالهيكل الصحيح

DROP TABLE IF EXISTS ic_database CASCADE;

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

CREATE INDEX idx_ic_database_part ON ic_database(part_number);
CREATE INDEX idx_ic_database_category ON ic_database(category);
CREATE INDEX idx_ic_database_family ON ic_database(device_family);
CREATE INDEX idx_ic_database_compatibles ON ic_database USING GIN(compatibles);

COMMENT ON TABLE ic_database IS 'IC database with part numbers, functions, and donor board information';

ALTER TABLE ic_database ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for ic_database" ON ic_database;
CREATE POLICY "Public read access for ic_database" ON ic_database FOR SELECT USING (true);

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
