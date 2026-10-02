import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import icDatabase from '@/data/ic_database.json';

export async function POST() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const results = {
    total: icDatabase.length,
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const ic of icDatabase) {
    try {
      const { error } = await supabaseAdmin.from('ic_database').insert({
        part_number: ic.partNumber,
        manufacturer: 'Various',
        description: ic.function,
        package_type: 'BGA',
        category: ic.category,
        pinout: {
          commonSymptoms: ic.commonSymptoms,
          diodeReadings: ic.diodeReadings,
          compatibles: ic.compatibles,
          deviceFamily: ic.deviceFamily,
        },
        specifications: {
          category: ic.category,
          deviceFamily: ic.deviceFamily,
        },
      });

      if (error) {
        results.failed++;
        results.errors.push(`${ic.partNumber}: ${error.message}`);
      } else {
        results.successful++;
      }
    } catch (err: any) {
      results.failed++;
      results.errors.push(`${ic.partNumber}: ${err.message}`);
    }
  }

  return NextResponse.json({
    message: 'Migration completed',
    results,
  });
}
