-- =====================================================
-- كل الترحيلات المتبقية - قم بتشغيل هذا في Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. إنشاء جدول المراجع الهندسية
-- =====================================================
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
  source TEXT,
  reliability_score INTEGER DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  is_official BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 2. إنشاء جدول الحالات العملية
-- =====================================================
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
  estimated_time INTEGER,
  success_rate INTEGER DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
  related_ics TEXT[],
  related_faults TEXT[],
  images TEXT[],
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 3. إنشاء جدول سجلات الإصلاح
-- =====================================================
CREATE TABLE IF NOT EXISTS repair_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_study_id UUID REFERENCES case_studies(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  serial_number TEXT,
  symptoms TEXT[] NOT NULL,
  initial_diagnosis TEXT,
  steps_taken JSONB NOT NULL,
  tools_used TEXT[],
  parts_replaced TEXT[],
  measurements JSONB DEFAULT '{}'::jsonb,
  final_diagnosis TEXT,
  outcome TEXT CHECK (outcome IN ('success', 'partial_success', 'failed', 'in_progress')),
  time_spent INTEGER,
  cost DECIMAL(10,2),
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  images TEXT[],
  notes TEXT
);

-- =====================================================
-- 4. إنشاء جدول علاقات المكونات
-- =====================================================
CREATE TABLE IF NOT EXISTS component_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_component TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('ic', 'capacitor', 'resistor', 'transistor', 'coil', 'connector', 'other')),
  target_component TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('ic', 'capacitor', 'resistor', 'transistor', 'coil', 'connector', 'other')),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('powers', 'controlled_by', 'interacts_with', 'located_near', 'signal_path', 'thermal_dependency', 'voltage_reference')),
  relationship_description TEXT,
  device_brand TEXT,
  device_model TEXT,
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  verified BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 5. إنشاء جدول المواصفات الفنية
-- =====================================================
CREATE TABLE IF NOT EXISTS technical_specifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_type TEXT NOT NULL,
  part_number TEXT NOT NULL,
  manufacturer TEXT,
  category TEXT,
  specifications JSONB NOT NULL,
  electrical_specs JSONB DEFAULT '{}'::jsonb,
  physical_specs JSONB DEFAULT '{}'::jsonb,
  thermal_specs JSONB DEFAULT '{}'::jsonb,
  pinout JSONB DEFAULT '{}'::jsonb,
  timing_specs JSONB DEFAULT '{}'::jsonb,
  application_notes TEXT,
  typical_applications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  datasheet_id UUID REFERENCES engineering_references(id)
);

-- =====================================================
-- 6. إنشاء جدول رسم المعرفة
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_graph (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_type TEXT NOT NULL CHECK (node_type IN ('component', 'fault', 'symptom', 'solution', 'device', 'category')),
  node_id TEXT NOT NULL,
  node_label TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 7. إنشاء جدول علاقات رسم المعرفة
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_node_id UUID NOT NULL REFERENCES knowledge_graph(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES knowledge_graph(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL,
  edge_weight INTEGER DEFAULT 1,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(source_node_id, target_node_id, edge_type)
);

-- =====================================================
-- 8. إنشاء جدول الكاش
-- =====================================================
CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 9. إنشاء جدول النسخ الاحتياطية
-- =====================================================
CREATE TABLE IF NOT EXISTS database_backups (
  id TEXT PRIMARY KEY,
  backup_data JSONB NOT NULL,
  description TEXT,
  tables_count INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  size_estimate TEXT DEFAULT '0 KB',
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. إنشاء جدول سجل الاستعادة
-- =====================================================
CREATE TABLE IF NOT EXISTS restore_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_id TEXT NOT NULL,
  restored_by TEXT DEFAULT 'admin',
  tables_restored TEXT[] DEFAULT ARRAY[]::TEXT[],
  results JSONB NOT NULL,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- إضافة المراجع الهندسية من الشركات المصنعة
-- =====================================================

-- TI (Texas Instruments) References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('BQ25601 Datasheet', 'Battery charging IC with power path management for smartphones and tablets', 'datasheet', 'Texas Instruments', 'BQ25601', 'PMIC', 'https://www.ti.com/product/BQ25601', 100, true, 'en'),
('BQ25895 Datasheet', 'Battery charging IC with integrated power path and USB Type-C', 'datasheet', 'Texas Instruments', 'BQ25895', 'PMIC', 'https://www.ti.com/product/BQ25895', 100, true, 'en'),
('TPS65982 Datasheet', 'USB Type-C and Power Delivery controller', 'datasheet', 'Texas Instruments', 'TPS65982', 'USB Controller', 'https://www.ti.com/product/TPS65982', 100, true, 'en'),
('LM2596 Datasheet', 'Simple step-down DC-DC converter', 'datasheet', 'Texas Instruments', 'LM2596', 'Power Management', 'https://www.ti.com/product/LM2596', 100, true, 'en'),
('TAS5707 Datasheet', 'Class-D audio amplifier', 'datasheet', 'Texas Instruments', 'TAS5707', 'Audio', 'https://www.ti.com/product/TAS5707', 100, true, 'en'),
('TLC5940 Datasheet', 'LED driver with PWM control', 'datasheet', 'Texas Instruments', 'TLC5940', 'LED Driver', 'https://www.ti.com/product/TLC5940', 100, true, 'en'),
('SN74LVC1G32 Datasheet', 'Low-voltage 2-input positive-AND gate', 'datasheet', 'Texas Instruments', 'SN74LVC1G32', 'Logic', 'https://www.ti.com/product/SN74LVC1G32', 100, true, 'en'),
('TPA6139A2 Datasheet', 'DirectDrive stereo headphone amplifier', 'datasheet', 'Texas Instruments', 'TPA6139A2', 'Audio', 'https://www.ti.com/product/TPA6139A2', 100, true, 'en')
ON CONFLICT DO NOTHING;

-- Qualcomm References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('PM8150 PMIC Datasheet', 'Power Management IC for Snapdragon processors', 'datasheet', 'Qualcomm', 'PM8150', 'PMIC', 'https://www.qualcomm.com/products', 95, true, 'en'),
('PM8941 PMIC Datasheet', 'Power Management IC with multiple voltage regulators', 'datasheet', 'Qualcomm', 'PM8941', 'PMIC', 'https://www.qualcomm.com/products', 95, true, 'en'),
('WCN3680 WiFi/BT Datasheet', 'Wireless connectivity combo chip', 'datasheet', 'Qualcomm', 'WCN3680', 'Connectivity', 'https://www.qualcomm.com/products', 95, true, 'en'),
('QCA6390 WiFi 6 Datasheet', 'WiFi 6/Bluetooth 5.1 combo chip', 'datasheet', 'Qualcomm', 'QCA6390', 'Connectivity', 'https://www.qualcomm.com/products', 95, true, 'en'),
('WCD9335 Audio Codec Datasheet', 'High-performance audio codec', 'datasheet', 'Qualcomm', 'WCD9335', 'Audio', 'https://www.qualcomm.com/products', 95, true, 'en'),
('PM8008 PMIC Datasheet', 'Power Management IC for mid-range devices', 'datasheet', 'Qualcomm', 'PM8008', 'PMIC', 'https://www.qualcomm.com/products', 95, true, 'en')
ON CONFLICT DO NOTHING;

-- NXP References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('PCF8574 I/O Expander Datasheet', 'Remote 8-bit I/O expander for I2C-bus', 'datasheet', 'NXP', 'PCF8574', 'I/O Controller', 'https://www.nxp.com/products/PCF8574', 100, true, 'en'),
('TJA1040 CAN Transceiver Datasheet', 'High-speed CAN transceiver', 'datasheet', 'NXP', 'TJA1040', 'CAN', 'https://www.nxp.com/products/TJA1040', 100, true, 'en'),
('PCA9685 PWM Driver Datasheet', '16-channel 12-bit PWM controller', 'datasheet', 'NXP', 'PCA9685', 'PWM Controller', 'https://www.nxp.com/products/PCA9685', 100, true, 'en'),
('BTS6143D Smart Power Switch Datasheet', 'High-side power switch', 'datasheet', 'NXP', 'BTS6143D', 'Power Switch', 'https://www.nxp.com/products/BTS6143D', 100, true, 'en'),
('MMA8452Q Accelerometer Datasheet', '3-axis digital accelerometer', 'datasheet', 'NXP', 'MMA8452Q', 'Sensor', 'https://www.nxp.com/products/MMA8452Q', 100, true, 'en')
ON CONFLICT DO NOTHING;

-- Analog Devices References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('ADXL345 Accelerometer Datasheet', '3-axis digital accelerometer', 'datasheet', 'Analog Devices', 'ADXL345', 'Sensor', 'https://www.analog.com/en/products/adxl345', 100, true, 'en'),
('AD8232 ECG Datasheet', 'Single-lead ECG analog front end', 'datasheet', 'Analog Devices', 'AD8232', 'Medical', 'https://www.analog.com/en/products/ad8232', 100, true, 'en'),
('MAX4466 Microphone Amplifier Datasheet', 'Low-noise microphone amplifier', 'datasheet', 'Analog Devices', 'MAX4466', 'Audio', 'https://www.analog.com/en/products/max4466', 100, true, 'en'),
('OP07 Op-Amp Datasheet', 'Low-offset operational amplifier', 'datasheet', 'Analog Devices', 'OP07', 'Analog', 'https://www.analog.com/en/products/op07', 100, true, 'en'),
('LTC1865 ADC Datasheet', '16-bit ADC with SPI interface', 'datasheet', 'Analog Devices', 'LTC1865', 'ADC', 'https://www.analog.com/en/products/ltc1865', 100, true, 'en')
ON CONFLICT DO NOTHING;

-- STMicroelectronics References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('STM32F103 Datasheet', '32-bit ARM Cortex-M3 microcontroller', 'datasheet', 'STMicroelectronics', 'STM32F103', 'Microcontroller', 'https://www.st.com/en/microcontrollers-microprocessors/stm32f103.html', 100, true, 'en'),
('STM32F4 Datasheet', '32-bit ARM Cortex-M4 microcontroller', 'datasheet', 'STMicroelectronics', 'STM32F4', 'Microcontroller', 'https://www.st.com/en/microcontrollers-microprocessors/stm32f4-series.html', 100, true, 'en'),
('L4960 Switching Regulator Datasheet', 'Step-down switching regulator', 'datasheet', 'STMicroelectronics', 'L4960', 'Power Management', 'https://www.st.com/en/power-management/l4960.html', 100, true, 'en'),
('LD1117 LDO Regulator Datasheet', 'Low-dropout voltage regulator', 'datasheet', 'STMicroelectronics', 'LD1117', 'Power Management', 'https://www.st.com/en/power-management/ld1117.html', 100, true, 'en'),
('TDA7498 Audio Amplifier Datasheet', 'Class-D audio amplifier', 'datasheet', 'STMicroelectronics', 'TDA7498', 'Audio', 'https://www.st.com/en/audio/tda7498.html', 100, true, 'en')
ON CONFLICT DO NOTHING;

-- Infineon References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('BTS50085 Smart Power Switch Datasheet', 'High-side power switch with diagnostic', 'datasheet', 'Infineon', 'BTS50085', 'Power Switch', 'https://www.infineon.com/products/bts50085', 100, true, 'en'),
('TLV493D 3D Hall Sensor Datasheet', '3D magnetic position sensor', 'datasheet', 'Infineon', 'TLV493D', 'Sensor', 'https://www.infineon.com/products/tlv493d', 100, true, 'en'),
('CY8CMBR3102 CapSense Datasheet', 'Capacitive sensing controller', 'datasheet', 'Infineon', 'CY8CMBR3102', 'Sensor', 'https://www.infineon.com/products/cy8cmbr3102', 100, true, 'en'),
('IRF740 MOSFET Datasheet', 'N-channel power MOSFET', 'datasheet', 'Infineon', 'IRF740', 'Power MOSFET', 'https://www.infineon.com/products/irf740', 100, true, 'en')
ON CONFLICT DO NOTHING;

-- Samsung Semiconductor References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('S3AM01A PMIC Datasheet', 'Power Management IC for Samsung devices', 'datasheet', 'Samsung', 'S3AM01A', 'PMIC', 'https://www.samsung.com/semiconductor', 95, true, 'en'),
('S5K3L3 Image Sensor Datasheet', 'CMOS image sensor', 'datasheet', 'Samsung', 'S5K3L3', 'Image Sensor', 'https://www.samsung.com/semiconductor', 95, true, 'en'),
('C2D818 Audio Codec Datasheet', 'Audio codec IC', 'datasheet', 'Samsung', 'C2D818', 'Audio', 'https://www.samsung.com/semiconductor', 95, true, 'en')
ON CONFLICT DO NOTHING;

-- Realtek References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('RTL8723BE WiFi/BT Datasheet', 'Wireless LAN + Bluetooth combo chip', 'datasheet', 'Realtek', 'RTL8723BE', 'Connectivity', 'https://www.realtek.com/en/products', 95, true, 'en'),
('ALC5686 Audio Codec Datasheet', 'High-definition audio codec', 'datasheet', 'Realtek', 'ALC5686', 'Audio', 'https://www.realtek.com/en/products', 95, true, 'en'),
('RTL8152 Ethernet Datasheet', 'Fast Ethernet controller', 'datasheet', 'Realtek', 'RTL8152', 'Ethernet', 'https://www.realtek.com/en/products', 95, true, 'en')
ON CONFLICT DO NOTHING;

-- Broadcom References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('BCM4356 WiFi/BT Datasheet', 'Dual-band wireless + Bluetooth combo', 'datasheet', 'Broadcom', 'BCM4356', 'Connectivity', 'https://www.broadcom.com/products', 95, true, 'en'),
('BCM4375 WiFi 6 Datasheet', 'WiFi 6 + Bluetooth 5.0 combo', 'datasheet', 'Broadcom', 'BCM4375', 'Connectivity', 'https://www.broadcom.com/products', 95, true, 'en'),
('CYW43439 WiFi/BT Datasheet', 'Wireless connectivity combo', 'datasheet', 'Broadcom', 'CYW43439', 'Connectivity', 'https://www.broadcom.com/products', 95, true, 'en')
ON CONFLICT DO NOTHING;

-- MediaTek References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('MT6765 Helio P35 Datasheet', 'Octa-core processor', 'datasheet', 'MediaTek', 'MT6765', 'Processor', 'https://www.mediatek.com/products', 95, true, 'en'),
('MTK6690 WiFi/BT Datasheet', 'Wireless connectivity combo', 'datasheet', 'MediaTek', 'MTK6690', 'Connectivity', 'https://www.mediatek.com/products', 95, true, 'en'),
('MT6370 PMIC Datasheet', 'Power Management IC', 'datasheet', 'MediaTek', 'MT6370', 'PMIC', 'https://www.mediatek.com/products', 95, true, 'en')
ON CONFLICT DO NOTHING;

-- Microchip References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('ATmega328P Datasheet', '8-bit AVR microcontroller', 'datasheet', 'Microchip', 'ATmega328P', 'Microcontroller', 'https://www.microchip.com/products/atmega328p', 100, true, 'en'),
('MCP23017 I/O Expander Datasheet', '16-bit I/O expander', 'datasheet', 'Microchip', 'MCP23017', 'I/O Controller', 'https://www.microchip.com/products/mcp23017', 100, true, 'en'),
('MCP4725 DAC Datasheet', '12-bit DAC with EEPROM', 'datasheet', 'Microchip', 'MCP4725', 'DAC', 'https://www.microchip.com/products/mcp4725', 100, true, 'en')
ON CONFLICT DO NOTHING;

-- Murata References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('LQH31MN Series Inductor Datasheet', 'Wire-wound chip inductor', 'datasheet', 'Murata', 'LQH31MN', 'Inductor', 'https://www.murata.com/products', 95, true, 'en'),
('GRM Series Capacitor Datasheet', 'Multilayer ceramic capacitor', 'datasheet', 'Murata', 'GRM', 'Capacitor', 'https://www.murata.com/products', 95, true, 'en')
ON CONFLICT DO NOTHING;

-- Vishay References
INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, reliability_score, is_official, language) VALUES
('IRF540N MOSFET Datasheet', 'N-channel power MOSFET', 'datasheet', 'Vishay', 'IRF540N', 'Power MOSFET', 'https://www.vishay.com/products', 100, true, 'en'),
('1N5819 Schottky Diode Datasheet', 'Schottky barrier rectifier', 'datasheet', 'Vishay', '1N5819', 'Diode', 'https://www.vishay.com/products', 100, true, 'en'),
('CRCW Resistor Datasheet', 'Thick film resistor', 'datasheet', 'Vishay', 'CRCW', 'Resistor', 'https://www.vishay.com/products', 100, true, 'en')
ON CONFLICT DO NOTHING;

-- =====================================================
-- إنشاء Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_engineering_references_manufacturer ON engineering_references(manufacturer);
CREATE INDEX IF NOT EXISTS idx_engineering_references_reliability ON engineering_references(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_case_studies_brand ON case_studies(device_brand);
CREATE INDEX IF NOT EXISTS idx_case_studies_model ON case_studies(device_model);
CREATE INDEX IF NOT EXISTS idx_repair_logs_user ON repair_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_component_relationships_source ON component_relationships(source_component);
CREATE INDEX IF NOT EXISTS idx_technical_specs_part ON technical_specifications(part_number);
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_database_backups_created_at ON database_backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restore_logs_backup_id ON restore_logs(backup_id);

-- =====================================================
-- إضافة Comments
-- =====================================================
COMMENT ON TABLE engineering_references IS 'مراجع هندسية من الشركات المصنعة الكبرى';
COMMENT ON TABLE case_studies IS 'حالات عملية حقيقية للإصلاح';
COMMENT ON TABLE repair_logs IS 'سجلات إصلاح مفصلة';
COMMENT ON TABLE component_relationships IS 'علاقات بين المكونات';
COMMENT ON TABLE technical_specifications IS 'بيانات فنية تفصيلية';
COMMENT ON TABLE knowledge_graph IS 'رسم المعرفة';
COMMENT ON TABLE knowledge_graph_edges IS 'علاقات رسم المعرفة';
COMMENT ON TABLE cache_entries IS 'جدول الكاش لاستجابات AI';
COMMENT ON TABLE database_backups IS 'جدول تخزين النسخ الاحتياطية';
COMMENT ON TABLE restore_logs IS 'جدول سجل عمليات استعادة النسخ الاحتياطية';

-- =====================================================
-- تم بنجاح! ✅
-- =====================================================
