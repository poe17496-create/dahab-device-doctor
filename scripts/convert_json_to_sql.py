#!/usr/bin/env python3
"""
Convert expert_patterns.json to SQL INSERT statements
This script reads the JSON file and generates SQL for importing all patterns
"""

import json
import re

# Read the JSON file
json_path = '../expert_patterns.json'
with open(json_path, 'r', encoding='utf-8') as f:
    patterns = json.load(f)

# Generate SQL
sql_statements = []
sql_statements.append("-- Import Expert Patterns from expert_patterns.json")
sql_statements.append("-- Generated SQL INSERT statements for all patterns")
sql_statements.append("")
sql_statements.append("INSERT INTO case_studies (id, title, description, device_brand, device_model, device_category, fault_category, fault_description, symptoms, diagnosis, solution, required_tools, required_parts, difficulty_level, estimated_time, success_rate, related_ics, related_faults, status, view_count, helpful_count, metadata) VALUES")
sql_statements.append("")

for i, pattern in enumerate(patterns):
    # Extract fault category
    symptom = pattern['symptom'].lower()
    fault_category = 'general'
    
    if 'power' in symptom or 'باور' in symptom or 'ميت' in symptom:
        fault_category = 'power'
    elif 'charge' in symptom or 'شحن' in symptom or 'battery' in symptom:
        fault_category = 'charging'
    elif 'display' in symptom or 'screen' in symptom or 'شاشة' in symptom:
        fault_category = 'display'
    elif 'audio' in symptom or 'صوت' in symptom or 'sound' in symptom:
        fault_category = 'audio'
    elif 'wifi' in symptom or 'واي فاي' in symptom or 'bluetooth' in symptom:
        fault_category = 'wireless'
    elif 'usb' in symptom or 'port' in symptom:
        fault_category = 'ports'
    elif 'ram' in symptom or 'رام' in symptom or 'memory' in symptom:
        fault_category = 'memory'
    elif 'heat' in symptom or 'حرارة' in symptom or 'سخونة' in symptom:
        fault_category = 'thermal'
    
    # Device info
    device_category = 'Laptop' if pattern['category'] == 'laptop' else 'PC Desktop'
    device_brand = 'General'
    device_model = 'Various Models'
    
    # Difficulty
    solution = pattern['solution']
    difficulty_level = 'intermediate'
    if 'Reflow' in solution or 'Reballing' in solution or 'BGA' in solution:
        difficulty_level = 'expert'
    elif 'replace' in solution or 'change' in solution or 'استبدال' in solution:
        difficulty_level = 'advanced'
    elif 'check' in solution or 'measure' in solution or 'فحص' in solution:
        difficulty_level = 'beginner'
    
    # Extract IC references
    ic_pattern = r'[A-Z]{2,4}\d{3,4}'
    related_ics = re.findall(ic_pattern, solution)
    
    # Escape single quotes in SQL
    title = pattern['symptom'].replace("'", "''")[:100]
    description = pattern['symptom'].replace("'", "''")
    diagnosis = solution[:500].replace("'", "''")
    solution_escaped = solution.replace("'", "''")
    
    # Build INSERT statement
    stmt = f"""(
  gen_random_uuid(),
  '{title}',
  '{description}',
  '{device_brand}',
  '{device_model}',
  '{device_category}',
  '{fault_category}',
  '{description}',
  ARRAY['{description}'],
  '{diagnosis}',
  '{solution_escaped}',
  ARRAY['مقياس ديود', 'مقياس التيستر', 'سخان الهواء الساخن'],
  ARRAY{related_ics if related_ics else '[]'},
  '{difficulty_level}',
  30,
  85,
  ARRAY{related_ics if related_ics else '[]'},
  ARRAY[],
  'verified',
  0,
  0,
  '{{"source": "expert_patterns.json", "pattern_index": {i}}}'::jsonb
)"""
    
    if i < len(patterns) - 1:
        stmt += ","
    
    sql_statements.append(stmt)
    sql_statements.append("")

sql_statements.append(";")
sql_statements.append("")
sql_statements.append("SELECT 'Expert patterns imported successfully!' as message;")
sql_statements.append("SELECT COUNT(*) as total_imported FROM case_studies WHERE metadata->>'source' = 'expert_patterns.json';")

# Write to file
output_path = 'import_expert_patterns_full.sql'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print(f"Generated SQL for {len(patterns)} patterns")
print(f"Saved to: {output_path}")
