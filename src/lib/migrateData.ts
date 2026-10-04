import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import icDatabase from '../data/ic_database.json';

export async function migrateICDatabase() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.error('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  console.log(`Starting migration of ${icDatabase.length} IC entries...`);

  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const ic of icDatabase) {
    try {
      const { error } = await supabaseAdmin.from('ic_database').insert({
        part_number: ic.partNumber,
        category: ic.category,
        device_family: ic.deviceFamily,
        function: ic.function,
        compatibles: ic.compatibles,
        common_symptoms: ic.commonSymptoms,
        diode_readings: ic.diodeReadings,
      });

      if (error) {
        failed++;
        errors.push(`${ic.partNumber}: ${error.message}`);
        console.error(`Failed to insert ${ic.partNumber}:`, error.message);
      } else {
        successful++;
        console.log(`✅ Inserted ${ic.partNumber}`);
      }
    } catch (err: any) {
      failed++;
      errors.push(`${ic.partNumber}: ${err.message}`);
      console.error(`Exception for ${ic.partNumber}:`, err.message);
    }
  }

  console.log(`IC Database migration complete: ${successful} successful, ${failed} failed`);
  return { success: true, total: icDatabase.length, successful, failed, errors };
}

export async function migrateAll() {
  console.log('=== Starting Full Migration ===');
  const icResult = await migrateICDatabase();
  console.log('=== Migration Complete ===');
  return { ic: icResult };
}
