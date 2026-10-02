-- Seed Data for Expert System
-- هذا الملف يحتوي على بيانات أولية لنظام الخبير الهندسي

-- 1. إضافة مراجع هندسية نموذجية
INSERT INTO engineering_references (id, title, description, reference_type, manufacturer, part_number, category, url, language, tags, source, reliability_score, is_official, metadata) VALUES
(
  gen_random_uuid(),
  'Apple iPhone 13 Pro Max Schematic',
  'المخطط الهندسي الكامل لـ iPhone 13 Pro Max',
  'technical_manual',
  'Apple',
  'iPhone 13 Pro Max',
  'Mobile',
  'https://apple.com',
  'ar',
  ARRAY['iphone', 'schematic', 'apple', 'mobile'],
  'Apple',
  100,
  true,
  '{"pages": 150, "year": 2021}'::jsonb
),
(
  gen_random_uuid(),
  'Qualcomm PM8150 Datasheet',
  'ورقة بيانات PM8150 Power Management IC',
  'datasheet',
  'Qualcomm',
  'PM8150',
  'PMIC',
  'https://qualcomm.com',
  'ar',
  ARRAY['pmic', 'qualcomm', 'power', 'datasheet'],
  'Qualcomm',
  100,
  true,
  '{"pages": 80, "year": 2019}'::jsonb
),
(
  gen_random_uuid(),
  'BQ25601 Battery Charger IC Application Note',
  'ملاحظات تطبيق BQ25601 لشحن البطاريات',
  'application_note',
  'Texas Instruments',
  'BQ25601',
  'Charger',
  'https://ti.com',
  'ar',
  ARRAY['charger', 'ti', 'battery', 'power'],
  'Texas Instruments',
  95,
  true,
  '{"pages": 25, "year": 2020}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 2. إضافة حالات عملية نموذجية
INSERT INTO case_studies (id, title, description, device_brand, device_model, device_category, fault_category, fault_description, symptoms, diagnosis, solution, required_tools, required_parts, difficulty_level, estimated_time, success_rate, related_ics, related_faults, status, view_count, helpful_count, metadata) VALUES
(
  gen_random_uuid(),
  'إصلاح شورت على خط VPH_PWR في iPhone 12 Pro',
  'شورت على خط الطاقة الرئيسي VPH_PWR يسبب سحب كامل على الباور سبلاي',
  'Apple',
  'iPhone 12 Pro',
  'Mobile',
  'Power',
  'Short circuit on VPH_PWR line',
  ARRAY['سحب كامل على الباور سبلاي', 'الجهاز لا يعمل', 'سخونة على BQ25601'],
  'شورت على آيسي الشحن BQ25601',
  'استبدال آيسي الشحن BQ25601 وفحص ملفات الباك المحيطة',
  ARRAY['مقياس التيستر', 'مقياس ديود', 'فلايت هويت', 'سخان الهواء الساخن'],
  ARRAY['BQ25601', 'L5001', 'C5001'],
  'advanced',
  45,
  85,
  ARRAY['BQ25601', 'PM8150'],
  ARRAY['VPH_PWR_SHORT', 'CHARGING_IC_FAILURE'],
  'verified',
  150,
  42,
  '{"steps_count": 8, "success_stories": 12}'::jsonb
),
(
  gen_random_uuid(),
  'إصلاح عدم شحن iPhone 11 Pro Max',
  'الجهاز لا يشعر بالشاحن ولا يظهر أي استجابة',
  'Apple',
  'iPhone 11 Pro Max',
  'Mobile',
  'Charging',
  'Tristar IC failure causing no charging response',
  ARRAY['لا يشحن', 'لا يتعرف على الكمبيوتر', 'سحب 0.00A'],
  'عطل في آيسي Tristar 1610A3',
  'استبدال آيسي Tristar 1610A3 وفحص مسارات USB D+ و D-',
  ARRAY['مقياس ديود', 'سخان الهواء الساخن', 'ملقط', 'فلكس'],
  ARRAY['1610A3', 'C4401', 'C4402'],
  'intermediate',
  30,
  90,
  ARRAY['1610A3', '1610A2'],
  ARRAY['TRISTAR_FAILURE', 'USB_PORT_ISSUE'],
  'verified',
  200,
  65,
  '{"steps_count": 6, "success_stories": 25}'::jsonb
),
(
  gen_random_uuid(),
  'إصلاح شورت على خط VDD_MAIN في Samsung Galaxy S21',
  'شورت على خط الطاقة الرئيسي VDD_MAIN',
  'Samsung',
  'Galaxy S21',
  'Mobile',
  'Power',
  'Short circuit on VDD_MAIN power rail',
  ARRAY['سحب كامل', 'الجهاز لا يعمل', 'سخونة على PM8150'],
  'شورت على آيسي الباور الرئيسي PM8150',
  'فحص ملفات الباك المحيطة بـ PM8150 واستبدال الملف التالف',
  ARRAY['مقياس التيستر', 'مقياس ديود', 'سخان الهواء الساخن'],
  ARRAY['PM8150', 'L8001', 'C8001'],
  'expert',
  60,
  75,
  ARRAY['PM8150', 'PM8150B'],
  ARRAY['VDD_MAIN_SHORT', 'PMIC_FAILURE'],
  'verified',
  100,
  38,
  '{"steps_count": 10, "success_stories": 8}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 3. إضافة علاقات مكونات نموذجية
INSERT INTO component_relationships (id, source_component, source_type, target_component, target_type, relationship_type, relationship_description, device_brand, device_model, confidence_score, source_reference, verified) VALUES
(
  gen_random_uuid(),
  'BQ25601',
  'ic',
  'VPH_PWR',
  'other',
  'powers',
  'BQ25601 يغذي خط VPH_PWR',
  'Apple',
  'iPhone 12 Pro',
  95,
  'schematic',
  true
),
(
  gen_random_uuid(),
  '1610A3',
  'ic',
  'PP3V0_TRISTAR',
  'other',
  'powered_by',
  'Tristar 1610A3 يعمل بـ 3.0V من خط PP3V0_TRISTAR',
  'Apple',
  'iPhone 11 Pro Max',
  90,
  'schematic',
  true
),
(
  gen_random_uuid(),
  'PM8150',
  'ic',
  'VDD_MAIN',
  'other',
  'powers',
  'PM8150 يولد خط VDD_MAIN الرئيسي',
  'Samsung',
  'Galaxy S21',
  95,
  'schematic',
  true
),
(
  gen_random_uuid(),
  'PM8150',
  'ic',
  'S2M',
  'coil',
  'controlled_by',
  'PM8150 يتحكم في ملف S2M لتوليد جهد المعالج',
  'Samsung',
  'Galaxy S21',
  85,
  'schematic',
  true
),
(
  gen_random_uuid(),
  'BQ25601',
  'ic',
  'PMID',
  'other',
  'signal_path',
  'مسار PMID يمر عبر BQ25601',
  'Apple',
  'iPhone 12 Pro',
  90,
  'measurement',
  true
)
ON CONFLICT DO NOTHING;

-- 4. إضافة مواصفات فنية نموذجية
INSERT INTO technical_specifications (id, component_type, part_number, manufacturer, category, specifications, electrical_specs, physical_specs, thermal_specs, pinout, application_notes, typical_applications) VALUES
(
  gen_random_uuid(),
  'PMIC',
  'PM8150',
  'Qualcomm',
  'Power Management',
  '{"family": "Snapdragon 855", "generation": "PM8150", "package": "BGA"}'::jsonb,
  '{"input_voltage": "3.3V-4.4V", "output_voltage": "0.8V-1.2V", "max_current": "10A", "efficiency": "92%"}'::jsonb,
  '{"package": "BGA-184", "dimensions": "12x12mm", "height": "0.8mm"}'::jsonb,
  '{"operating_temp": "-40°C to 85°C", "junction_temp": "125°C"}'::jsonb,
  '{"total_pins": 184, "power_pins": 45, "ground_pins": 40, "control_pins": 99}'::jsonb,
  'يستخدم في هواتف Qualcomm Snapdragon 855 وما فوق',
  ARRAY['Smartphones', 'Tablets', 'Wearables']
),
(
  gen_random_uuid(),
  'Charging IC',
  'BQ25601',
  'Texas Instruments',
  'Battery Charger',
  '{"family": "BQ256xx", "input": "USB-C", "output": "Single-cell Li-ion"}'::jsonb,
  '{"input_voltage": "4.5V-6V", "charging_current": "3A", "fast_charge": "Yes"}'::jsonb,
  '{"package": "WQFN-20", "dimensions": "4x4mm", "height": "0.8mm"}'::jsonb,
  '{"operating_temp": "-40°C to 85°C"}'::jsonb,
  '{"total_pins": 20, "power_pins": 4, "ground_pins": 2, "control_pins": 14}'::jsonb,
  'آيسي شحن بطاريات من Texas Instruments',
  ARRAY['Smartphones', 'Power Banks', 'Portable Devices']
),
(
  gen_random_uuid(),
  'Tristar IC',
  '1610A3',
  'Apple',
  'USB Controller',
  '{"family": "Tristar", "function": "USB/Charging Controller"}'::jsonb,
  '{"input_voltage": "3.0V-3.6V", "usb_version": "2.0", "data_rate": "480Mbps"}'::jsonb,
  '{"package": "BGA-64", "dimensions": "5x5mm", "height": "0.5mm"}'::jsonb,
  '{"operating_temp": "0°C to 70°C"}'::jsonb,
  '{"total_pins": 64, "usb_pins": 8, "power_pins": 12, "control_pins": 44}'::jsonb,
  'آيسي Tristar من Apple للتحكم في USB والشحن',
  ARRAY['iPhone 6s', 'iPhone 6s Plus', 'iPhone SE']
)
ON CONFLICT DO NOTHING;

-- 5. إضافة قواعد تشخيص نموذجية
INSERT INTO diagnostic_rules (id, rule_name, rule_description, condition, action, confidence_score, priority, device_brand, device_model, fault_category, is_active, usage_count, success_count) VALUES
(
  gen_random_uuid(),
  'VPH_PWR Short Detection',
  'كشف شورت على خط VPH_PWR',
  '{"symptoms": ["full power draw", "device not working"], "readings": {"VPH_PWR_diode": "0.000V"}}'::jsonb,
  '{"diagnosis": "Short on VPH_PWR line", "action": "Check BQ25601 and surrounding coils", "priority": "high"}'::jsonb,
  90,
  8,
  'Apple',
  'iPhone 12 Pro',
  'Power',
  true,
  0,
  0
),
(
  gen_random_uuid(),
  'Tristar Failure Detection',
  'كشف عطل آيسي Tristar',
  '{"symptoms": ["no charging", "not recognized by computer"], "readings": {"USB_D+_diode": "0.000V", "USB-D_diode": "0.000V"}}'::jsonb,
  '{"diagnosis": "Tristar IC failure", "action": "Replace Tristar IC and check USB paths", "priority": "high"}'::jsonb,
  85,
  7,
  'Apple',
  'iPhone 11 Pro Max',
  'Charging',
  true,
  0,
  0
),
(
  gen_random_uuid(),
  'VDD_MAIN Short Detection',
  'كشف شورت على خط VDD_MAIN',
  '{"symptoms": ["full power draw", "device not working"], "readings": {"VDD_MAIN_diode": "0.000V"}}'::jsonb,
  '{"diagnosis": "Short on VDD_MAIN line", "action": "Check PM8150 and surrounding coils", "priority": "high"}'::jsonb,
  85,
  9,
  'Samsung',
  'Galaxy S21',
  'Power',
  true,
  0,
  0
)
ON CONFLICT DO NOTHING;

-- 6. إضافة دلائل مرجعية سريعة
INSERT INTO quick_reference_guides (id, title, description, category, content, device_brand, device_model, language, order_index, is_featured) VALUES
(
  gen_random_uuid(),
  'قيم الفولت النموذجية لـ iPhone',
  'قيم الفولت والممانعة النموذجية لخطوط الباور في iPhone',
  'power_readings',
  '{"VDD_MAIN": "0.500V", "VPH_PWR": "0.550V", "PP3V3_Tristar": "0.650V", "PP5V0_USB": "0.500V"}'::jsonb,
  'Apple',
  'iPhone',
  'ar',
  1,
  true
),
(
  gen_random_uuid(),
  'قائمة فحص شورت الباور',
  'خطوات فحص شورت الباور الرئيسي',
  'checklist',
  '{"steps": ["Check VDD_MAIN", "Check VPH_PWR", "Check PP3V3_Tristar", "Check PMIC outputs"]}'::jsonb,
  'General',
  'All',
  'ar',
  2,
  true
),
(
  gen_random_uuid(),
  'أيقونات الأيسيهات الشائعة',
  'أسماء وأرقام الأيسيهات الشائعة في الموبايل',
  'ic_reference',
  '{"PMIC": ["PM8150", "PM8150B"], "Charger": ["BQ25601", "BQ25618"], "Tristar": ["1610A1", "1610A2", "1610A3"]}'::jsonb,
  'General',
  'All',
  'ar',
  3,
  true
)
ON CONFLICT DO NOTHING;

-- 7. إضافة عقد Knowledge Graph
INSERT INTO knowledge_graph (id, node_type, node_id, node_label, properties) VALUES
(
  gen_random_uuid(),
  'component',
  'BQ25601',
  'BQ25601 Charging IC',
  '{"manufacturer": "Texas Instruments", "category": "Charger"}'::jsonb
),
(
  gen_random_uuid(),
  'component',
  'PM8150',
  'PM8150 PMIC',
  '{"manufacturer": "Qualcomm", "category": "PMIC"}'::jsonb
),
(
  gen_random_uuid(),
  'component',
  '1610A3',
  '1610A3 Tristar',
  '{"manufacturer": "Apple", "category": "USB Controller"}'::jsonb
),
(
  gen_random_uuid(),
  'fault',
  'VPH_PWR_SHORT',
  'Short on VPH_PWR',
  '{"severity": "high", "common": true}'::jsonb
),
(
  gen_random_uuid(),
  'fault',
  'TRISTAR_FAILURE',
  'Tristar IC Failure',
  '{"severity": "medium", "common": true}'::jsonb
),
(
  gen_random_uuid(),
  'symptom',
  'full_power_draw',
  'Full Power Draw',
  '{"severity": "high"}'::jsonb
),
(
  gen_random_uuid(),
  'symptom',
  'no_charging',
  'No Charging',
  '{"severity": "medium"}'::jsonb
),
(
  gen_random_uuid(),
  'device',
  'iPhone_12_Pro',
  'iPhone 12 Pro',
  '{"brand": "Apple", "year": 2020}'::jsonb
),
(
  gen_random_uuid(),
  'device',
  'iPhone_11_Pro_Max',
  'iPhone 11 Pro Max',
  '{"brand": "Apple", "year": 2019}'::jsonb
),
(
  gen_random_uuid(),
  'device',
  'Galaxy_S21',
  'Galaxy S21',
  '{"brand": "Samsung", "year": 2021}'::jsonb
)
ON CONFLICT DO NOTHING;

-- رسالة نجاح
SELECT 'Seed data inserted successfully!' as message;
