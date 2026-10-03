import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import icDatabase from '../data/ic_database.json';
import {
  buildIphone15ProMaxBoard,
  buildIphone14ProMaxBoard,
  buildIphone15ProBoard,
  buildIphone13ProBoard,
  buildIphone12ProBoard,
  buildIphone11ProMaxBoard,
} from './boardviewPresets';

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

export async function migrateBoardviews() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.error('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const boardviews = [
    buildIphone15ProMaxBoard(),
    buildIphone14ProMaxBoard(),
    buildIphone15ProBoard(),
    buildIphone13ProBoard(),
    buildIphone12ProBoard(),
    buildIphone11ProMaxBoard(),
  ];

  console.log(`Starting migration of ${boardviews.length} boardviews...`);

  const adminId = 'user_admin';
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const boardview of boardviews) {
    try {
      const { error } = await supabaseAdmin.from('boardviews').insert({
        id: boardview.id,
        user_id: adminId,
        device_name: boardview.title,
        model: boardview.deviceModel,
        brand: 'Apple',
        category: 'Smartphone',
        description: `مخطط دائرة كهربائية تفصيلي لـ ${boardview.deviceModel}`,
        specifications: {
          width: boardview.width,
          height: boardview.height,
          layersCount: boardview.layersCount,
          nets: boardview.nets,
          parts: boardview.parts,
          outlinePoints: boardview.outlinePoints,
        },
      });

      if (error) {
        failed++;
        errors.push(`${boardview.id}: ${error.message}`);
        console.error(`Failed to insert ${boardview.id}:`, error.message);
      } else {
        successful++;
        console.log(`✅ Inserted ${boardview.id}`);
      }
    } catch (err: any) {
      failed++;
      errors.push(`${boardview.id}: ${err.message}`);
      console.error(`Exception for ${boardview.id}:`, err.message);
    }
  }

  console.log(`Boardviews migration complete: ${successful} successful, ${failed} failed`);
  return { success: true, total: boardviews.length, successful, failed, errors };
}

export async function migrateAll() {
  console.log('=== Starting Full Migration ===');
  const icResult = await migrateICDatabase();
  const boardviewResult = await migrateBoardviews();
  console.log('=== Migration Complete ===');
  return { ic: icResult, boardviews: boardviewResult };
}
