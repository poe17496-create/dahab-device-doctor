/**
 * Script to import expert_patterns.json into Supabase
 * Converts JSON patterns to case_studies in the database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read the expert patterns JSON
const patternsPath = path.join(__dirname, '../expert_patterns.json');
const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function importPatterns() {
  console.log(`Found ${patterns.length} patterns to import...`);

  let successCount = 0;
  let errorCount = 0;

  for (const pattern of patterns) {
    try {
      // Extract fault category from symptom
      let faultCategory = 'general';
      const symptom = pattern.symptom.toLowerCase();

      if (symptom.includes('power') || symptom.includes('باور') || symptom.includes('ميت')) {
        faultCategory = 'power';
      } else if (symptom.includes('charge') || symptom.includes('شحن') || symptom.includes('battery')) {
        faultCategory = 'charging';
      } else if (symptom.includes('display') || symptom.includes('screen') || symptom.includes('شاشة')) {
        faultCategory = 'display';
      } else if (symptom.includes('audio') || symptom.includes('صوت') || symptom.includes('sound')) {
        faultCategory = 'audio';
      } else if (symptom.includes('wifi') || symptom.includes('واي فاي') || symptom.includes('bluetooth')) {
        faultCategory = 'wireless';
      } else if (symptom.includes('usb') || symptom.includes('port')) {
        faultCategory = 'ports';
      } else if (symptom.includes('ram') || symptom.includes('رام') || symptom.includes('memory')) {
        faultCategory = 'memory';
      } else if (symptom.includes('heat') || symptom.includes('حرارة') || symptom.includes('سخونة')) {
        faultCategory = 'thermal';
      }

      // Extract device type from category
      const deviceCategory = pattern.category === 'laptop' ? 'Laptop' : 'PC Desktop';
      const deviceBrand = 'General'; // Since patterns are general, not brand-specific
      const deviceModel = pattern.category === 'laptop' ? 'Various Laptop Models' : 'Various PC Models';

      // Extract symptoms array from description
      const symptoms = [pattern.symptom];

      // Determine difficulty based on solution complexity
      let difficultyLevel = 'intermediate';
      if (pattern.solution.includes('Reflow') || pattern.solution.includes('Reballing') || pattern.solution.includes('BGA')) {
        difficultyLevel = 'expert';
      } else if (pattern.solution.includes('replace') || pattern.solution.includes('change') || pattern.solution.includes('استبدال')) {
        difficultyLevel = 'advanced';
      } else if (pattern.solution.includes('check') || pattern.solution.includes('measure') || pattern.solution.includes('فحص')) {
        difficultyLevel = 'beginner';
      }

      // Extract IC references from solution
      const icPattern = /[A-Z]{2,4}\d{3,4}/g;
      const relatedIcs = pattern.solution.match(icPattern) || [];

      // Create case study
      const { data, error } = await supabase
        .from('case_studies')
        .insert({
          title: pattern.symptom.substring(0, 100),
          description: pattern.symptom,
          device_brand: deviceBrand,
          device_model: deviceModel,
          device_category: deviceCategory,
          fault_category: faultCategory,
          fault_description: pattern.symptom,
          symptoms: symptoms,
          diagnosis: pattern.solution.substring(0, 500),
          solution: pattern.solution,
          required_tools: ['مقياس ديود', 'مقياس التيستر', 'سخان الهواء الساخن'],
          required_parts: relatedIcs,
          difficulty_level: difficultyLevel,
          estimated_time: 30,
          success_rate: 85,
          related_ics: relatedIcs,
          related_faults: [],
          status: 'verified',
          view_count: 0,
          helpful_count: 0,
          metadata: {
            source: 'expert_patterns.json',
            imported_at: new Date().toISOString()
          }
        })
        .select();

      if (error) {
        console.error(`Error importing pattern:`, error);
        errorCount++;
      } else {
        successCount++;
        console.log(`✅ Imported: ${pattern.symptom.substring(0, 50)}...`);
      }
    } catch (err) {
      console.error(`Error processing pattern:`, err);
      errorCount++;
    }
  }

  console.log(`\n=== Import Summary ===`);
  console.log(`Total patterns: ${patterns.length}`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
}

importPatterns().catch(console.error);
