-- Migration: Add Expert System Tables for Engineering Knowledge Base
-- This migration adds tables for engineering references, case studies, repair logs,
-- component relationships, and technical specifications to transform the system
-- into a comprehensive engineering expert system.

-- 1. Engineering References Table (مراجع هندسية موثقة)
CREATE TABLE IF NOT EXISTS engineering_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('datasheet', 'application_note', 'whitepaper', 'technical_manual', 'standard', 'guide')),
  manufacturer TEXT,
  part_number TEXT,
  category TEXT,
  url TEXT,
  pdf_url TEXT,
  pages INTEGER,
  publication_date DATE,
  language TEXT DEFAULT 'ar',
  tags TEXT[],
  source TEXT, -- Source of the reference (e.g., TI, Analog Devices, Apple, etc.)
  reliability_score INTEGER DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  is_official BOOLEAN DEFAULT FALSE, -- Official manufacturer document
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Case Studies Table (حالات عملية حقيقية)
CREATE TABLE IF NOT EXISTS case_studies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  device_category TEXT,
  fault_category TEXT NOT NULL,
  fault_description TEXT NOT NULL,
  symptoms TEXT[] NOT NULL,
  diagnosis TEXT NOT NULL,
  solution TEXT NOT NULL,
  required_tools TEXT[],
  required_parts TEXT[],
  difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_time INTEGER, -- in minutes
  success_rate INTEGER DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
  related_ics TEXT[], -- Array of IC part numbers
  related_faults TEXT[], -- Array of fault codes
  images TEXT[], -- Array of image URLs
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Repair Logs Table (سجلات إصلاح مفصلة)
CREATE TABLE IF NOT EXISTS repair_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID REFERENCES case_studies(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  serial_number TEXT,
  symptoms TEXT[] NOT NULL,
  initial_diagnosis TEXT,
  steps_taken JSONB NOT NULL, -- Array of repair steps with timestamps
  tools_used TEXT[],
  parts_replaced TEXT[],
  measurements JSONB DEFAULT '{}'::jsonb, -- Voltage, resistance, etc.
  final_diagnosis TEXT,
  outcome TEXT CHECK (outcome IN ('success', 'partial_success', 'failed', 'in_progress')),
  time_spent INTEGER, -- in minutes
  cost DECIMAL(10,2),
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  images TEXT[],
  notes TEXT
);

-- 4. Component Relationships Table (علاقات بين المكونات)
CREATE TABLE IF NOT EXISTS component_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_component TEXT NOT NULL, -- Part number or component name
  source_type TEXT NOT NULL CHECK (source_type IN ('ic', 'capacitor', 'resistor', 'transistor', 'coil', 'connector', 'other')),
  target_component TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('ic', 'capacitor', 'resistor', 'transistor', 'coil', 'connector', 'other')),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('powers', 'controlled_by', 'interacts_with', 'located_near', 'signal_path', 'thermal_dependency', 'voltage_reference')),
  relationship_description TEXT,
  device_brand TEXT,
  device_model TEXT,
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source_reference TEXT, -- Where this relationship came from (schematic, measurement, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  verified BOOLEAN DEFAULT FALSE
);

-- 5. Technical Specifications Table (بيانات فنية تفصيلية)
CREATE TABLE IF NOT EXISTS technical_specifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_type TEXT NOT NULL,
  part_number TEXT NOT NULL,
  manufacturer TEXT,
  category TEXT,
  specifications JSONB NOT NULL, -- Detailed specs in JSON format
  electrical_specs JSONB DEFAULT '{}'::jsonb, -- Voltage, current, power ratings
  physical_specs JSONB DEFAULT '{}'::jsonb, -- Dimensions, package type
  thermal_specs JSONB DEFAULT '{}'::jsonb, -- Temperature ranges
  pinout JSONB DEFAULT '{}'::jsonb, -- Pin configuration
  timing_specs JSONB DEFAULT '{}'::jsonb, -- Timing characteristics
  application_notes TEXT,
  typical_applications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  datasheet_id UUID REFERENCES engineering_references(id)
);

-- 6. Knowledge Graph Table (رسم المعرفة)
CREATE TABLE IF NOT EXISTS knowledge_graph (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_type TEXT NOT NULL CHECK (node_type IN ('component', 'fault', 'symptom', 'solution', 'device', 'category')),
  node_id TEXT NOT NULL, -- ID of the entity (part number, fault code, etc.)
  node_label TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW
);

-- 7. Knowledge Graph Edges Table (علاقات رسم المعرفة)
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_node_id UUID NOT NULL REFERENCES knowledge_graph(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES knowledge_graph(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL, -- Type of relationship
  edge_weight INTEGER DEFAULT 1,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_node_id, target_node_id, edge_type)
);

-- 8. Image Gallery Table (معرض الصور)
CREATE TABLE IF NOT EXISTS image_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT,
  related_type TEXT CHECK (related_type IN ('case_study', 'repair_log', 'ic', 'boardview', 'reference')),
  related_id UUID,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  is_verified BOOLEAN DEFAULT FALSE
);

-- 9. Diagnostic Rules Table (قواعد التشخيص)
CREATE TABLE IF NOT EXISTS diagnostic_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  condition JSONB NOT NULL, -- JSON representation of the condition
  action JSONB NOT NULL, -- JSON representation of the action/recommendation
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  device_brand TEXT,
  device_model TEXT,
  fault_category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  usage_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0
);

-- 10. Quick Reference Guide Table (دليل المرجع السريع)
CREATE TABLE IF NOT EXISTS quick_reference_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  content JSONB NOT NULL, -- Structured content in JSON
  device_brand TEXT,
  device_model TEXT,
  language TEXT DEFAULT 'ar',
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_engineering_references_type ON engineering_references(reference_type);
CREATE INDEX IF NOT EXISTS idx_engineering_references_category ON engineering_references(category);
CREATE INDEX IF NOT EXISTS idx_engineering_references_part ON engineering_references(part_number);
CREATE INDEX IF NOT EXISTS idx_engineering_references_tags ON engineering_references USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_case_studies_device ON case_studies(device_brand, device_model);
CREATE INDEX IF NOT EXISTS idx_case_studies_fault ON case_studies(fault_category);
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status);
CREATE INDEX IF NOT EXISTS idx_case_studies_ics ON case_studies USING GIN(related_ics);

CREATE INDEX IF NOT EXISTS idx_repair_logs_user ON repair_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_repair_logs_device ON repair_logs(device_brand, device_model);
CREATE INDEX IF NOT EXISTS idx_repair_logs_outcome ON repair_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_repair_logs_case ON repair_logs(case_study_id);

CREATE INDEX IF NOT EXISTS idx_component_relationships_source ON component_relationships(source_component);
CREATE INDEX IF NOT EXISTS idx_component_relationships_target ON component_relationships(target_component);
CREATE INDEX IF NOT EXISTS idx_component_relationships_type ON component_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_technical_specs_part ON technical_specifications(part_number);
CREATE INDEX IF NOT EXISTS idx_technical_specs_category ON technical_specifications(category);

CREATE INDEX IF NOT EXISTS idx_knowledge_graph_node ON knowledge_graph(node_type, node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_source ON knowledge_graph_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_target ON knowledge_graph_edges(target_node_id);

CREATE INDEX IF NOT EXISTS idx_image_gallery_related ON image_gallery(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_image_gallery_category ON image_gallery(category);

CREATE INDEX IF NOT EXISTS idx_diagnostic_rules_device ON diagnostic_rules(device_brand, device_model);
CREATE INDEX IF NOT EXISTS idx_diagnostic_rules_fault ON diagnostic_rules(fault_category);
CREATE INDEX IF NOT EXISTS idx_diagnostic_rules_active ON diagnostic_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_quick_reference_category ON quick_reference_guides(category);
CREATE INDEX IF NOT EXISTS idx_quick_reference_device ON quick_reference_guides(device_brand, device_model);

-- Add comments for documentation
COMMENT ON TABLE engineering_references IS 'Stores engineering references like datasheets, application notes, and technical manuals';
COMMENT ON TABLE case_studies IS 'Real-world repair case studies with detailed solutions';
COMMENT ON TABLE repair_logs IS 'Detailed repair logs from technicians with step-by-step progress';
COMMENT ON TABLE component_relationships IS 'Relationships between components (powers, controlled_by, etc.)';
COMMENT ON TABLE technical_specifications IS 'Detailed technical specifications for components';
COMMENT ON TABLE knowledge_graph IS 'Knowledge graph nodes for AI-powered diagnostics';
COMMENT ON TABLE knowledge_graph_edges IS 'Knowledge graph edges representing relationships';
COMMENT ON TABLE image_gallery IS 'Image gallery with references to related entities';
COMMENT ON TABLE diagnostic_rules IS 'Diagnostic rules for automated fault detection';
COMMENT ON TABLE quick_reference_guides IS 'Quick reference guides for common tasks';

-- Enable Row Level Security (RLS) with safety checks
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'engineering_references') THEN
    ALTER TABLE engineering_references ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'case_studies') THEN
    ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'repair_logs') THEN
    ALTER TABLE repair_logs ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'component_relationships') THEN
    ALTER TABLE component_relationships ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'technical_specifications') THEN
    ALTER TABLE technical_specifications ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'knowledge_graph') THEN
    ALTER TABLE knowledge_graph ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'knowledge_graph_edges') THEN
    ALTER TABLE knowledge_graph_edges ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'image_gallery') THEN
    ALTER TABLE image_gallery ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'diagnostic_rules') THEN
    ALTER TABLE diagnostic_rules ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quick_reference_guides') THEN
    ALTER TABLE quick_reference_guides ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- RLS Policies (public read for most tables, write only for authenticated users)
-- Drop policies if they exist, then create them
DO $$ BEGIN
  -- engineering_references policies
  DROP POLICY IF EXISTS "Public read access for engineering_references" ON engineering_references;
  DROP POLICY IF EXISTS "Authenticated insert for engineering_references" ON engineering_references;
  DROP POLICY IF EXISTS "Authenticated update for engineering_references" ON engineering_references;
  CREATE POLICY "Public read access for engineering_references" ON engineering_references FOR SELECT USING (true);
  CREATE POLICY "Authenticated insert for engineering_references" ON engineering_references FOR INSERT WITH CHECK (auth.uid() = created_by);
  CREATE POLICY "Authenticated update for engineering_references" ON engineering_references FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = verified_by);

  -- case_studies policies
  DROP POLICY IF EXISTS "Public read access for case_studies" ON case_studies;
  DROP POLICY IF EXISTS "Authenticated insert for case_studies" ON case_studies;
  DROP POLICY IF EXISTS "Authenticated update for case_studies" ON case_studies;
  CREATE POLICY "Public read access for case_studies" ON case_studies FOR SELECT USING (true);
  CREATE POLICY "Authenticated insert for case_studies" ON case_studies FOR INSERT WITH CHECK (auth.uid() = created_by);
  CREATE POLICY "Authenticated update for case_studies" ON case_studies FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = verified_by);

  -- repair_logs policies
  DROP POLICY IF EXISTS "User read own repair_logs" ON repair_logs;
  DROP POLICY IF EXISTS "Authenticated insert for repair_logs" ON repair_logs;
  DROP POLICY IF EXISTS "User update own repair_logs" ON repair_logs;
  CREATE POLICY "User read own repair_logs" ON repair_logs FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Authenticated insert for repair_logs" ON repair_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "User update own repair_logs" ON repair_logs FOR UPDATE USING (auth.uid() = user_id);

  -- component_relationships policies
  DROP POLICY IF EXISTS "Public read access for component_relationships" ON component_relationships;
  DROP POLICY IF EXISTS "Authenticated insert for component_relationships" ON component_relationships;
  CREATE POLICY "Public read access for component_relationships" ON component_relationships FOR SELECT USING (true);
  CREATE POLICY "Authenticated insert for component_relationships" ON component_relationships FOR INSERT WITH CHECK (auth.uid() = created_by);

  -- technical_specifications policies
  DROP POLICY IF EXISTS "Public read access for technical_specifications" ON technical_specifications;
  DROP POLICY IF EXISTS "Authenticated insert for technical_specifications" ON technical_specifications;
  CREATE POLICY "Public read access for technical_specifications" ON technical_specifications FOR SELECT USING (true);
  CREATE POLICY "Authenticated insert for technical_specifications" ON technical_specifications FOR INSERT WITH CHECK (true);

  -- knowledge_graph policies
  DROP POLICY IF EXISTS "Public read access for knowledge_graph" ON knowledge_graph;
  DROP POLICY IF EXISTS "Public read access for knowledge_graph_edges" ON knowledge_graph_edges;
  CREATE POLICY "Public read access for knowledge_graph" ON knowledge_graph FOR SELECT USING (true);
  CREATE POLICY "Public read access for knowledge_graph_edges" ON knowledge_graph_edges FOR SELECT USING (true);

  -- image_gallery policies
  DROP POLICY IF EXISTS "Public read access for image_gallery" ON image_gallery;
  DROP POLICY IF EXISTS "Authenticated insert for image_gallery" ON image_gallery;
  CREATE POLICY "Public read access for image_gallery" ON image_gallery FOR SELECT USING (true);
  CREATE POLICY "Authenticated insert for image_gallery" ON image_gallery FOR INSERT WITH CHECK (auth.uid() = created_by);

  -- diagnostic_rules policies
  DROP POLICY IF EXISTS "Public read access for diagnostic_rules" ON diagnostic_rules;
  DROP POLICY IF EXISTS "Admin insert for diagnostic_rules" ON diagnostic_rules;
  DROP POLICY IF EXISTS "Admin update for diagnostic_rules" ON diagnostic_rules;
  CREATE POLICY "Public read access for diagnostic_rules" ON diagnostic_rules FOR SELECT USING (is_active = true);
  CREATE POLICY "Admin insert for diagnostic_rules" ON diagnostic_rules FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
  CREATE POLICY "Admin update for diagnostic_rules" ON diagnostic_rules FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

  -- quick_reference_guides policies
  DROP POLICY IF EXISTS "Public read access for quick_reference_guides" ON quick_reference_guides;
  DROP POLICY IF EXISTS "Authenticated insert for quick_reference_guides" ON quick_reference_guides;
  DROP POLICY IF EXISTS "Authenticated update for quick_reference_guides" ON quick_reference_guides;
  CREATE POLICY "Public read access for quick_reference_guides" ON quick_reference_guides FOR SELECT USING (true);
  CREATE POLICY "Authenticated insert for quick_reference_guides" ON quick_reference_guides FOR INSERT WITH CHECK (auth.uid() = created_by);
  CREATE POLICY "Authenticated update for quick_reference_guides" ON quick_reference_guides FOR UPDATE USING (auth.uid() = created_by);
END $$;
